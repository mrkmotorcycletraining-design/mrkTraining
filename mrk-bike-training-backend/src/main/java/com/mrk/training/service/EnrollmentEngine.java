package com.mrk.training.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mrk.training.dto.enrollment.EnrollmentRequest;
import com.mrk.training.dto.scheduler.ScheduleQuery;
import com.mrk.training.dto.scheduler.TimeInterval;
import com.mrk.training.event.EnrollmentCreatedEvent;
import com.mrk.training.event.SlotApprovedEvent;
import com.mrk.training.event.SlotRejectedEvent;
import com.mrk.training.exception.EnrollmentLimitException;
import com.mrk.training.exception.InvalidStartDateException;
import com.mrk.training.exception.ScheduleContinuityException;
import com.mrk.training.model.ClientCourseEnrollment;
import com.mrk.training.model.ClientProfile;
import com.mrk.training.model.Course;
import com.mrk.training.model.EnrollmentStatus;
import com.mrk.training.model.ScheduleSlot;
import com.mrk.training.model.ScheduleStatus;
import com.mrk.training.model.ScheduleType;
import com.mrk.training.model.TrainerProfile;
import com.mrk.training.repository.BranchRepository;
import com.mrk.training.repository.ClientRepository;
import com.mrk.training.repository.CourseRepository;
import com.mrk.training.repository.EnrollmentRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.repository.TrainerRepository;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.security.SecurityUtils;

@Service
public class EnrollmentEngine {

    private final ClientRepository clientRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleSlotRepository slotRepository;
    private final TrainerRepository trainerRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final SchedulerService schedulerService;
    private final ApplicationEventPublisher events;

    public EnrollmentEngine(
            ClientRepository clientRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            ScheduleSlotRepository slotRepository,
            TrainerRepository trainerRepository,
            BranchRepository branchRepository,
            UserRepository userRepository,
            SchedulerService schedulerService,
            ApplicationEventPublisher events) {
        this.clientRepository = clientRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.slotRepository = slotRepository;
        this.trainerRepository = trainerRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.schedulerService = schedulerService;
        this.events = events;
    }

    public void validateEnrollment(EnrollmentRequest request, boolean adminOverride) {
        ClientProfile client = clientRepository.findById(resolveClientId(request))
                .orElseThrow(() -> new IllegalArgumentException("Client not found."));
        if (!client.getUser().isActive()) {
            throw new EnrollmentLimitException("Client account is not active.");
        }
        if (client.getAllowedNumOfTrainings() == null || client.getAllowedNumOfTrainings() < 1) {
            throw new EnrollmentLimitException("No training allowance remaining.");
        }
        if (!adminOverride && request.startDate().getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new InvalidStartDateException();
        }
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found."));
        ScheduleQuery query = new ScheduleQuery(
                request.branchId(),
                request.assetType(),
                request.startDate(),
                request.preferredDays() != null ? request.preferredDays() : List.of(),
                request.hoursPerDay(),
                course.getTotalDays());
        List<TimeInterval> intervals = schedulerService.computeAvailableIntervals(query);
        if (intervals.size() < course.getTotalDays()) {
            throw new ScheduleContinuityException("Unable to find continuous schedule for preferred days.");
        }
    }

    @Transactional
    public ClientCourseEnrollment submitEnrollment(EnrollmentRequest request) {
        boolean adminOverride = SecurityUtils.isAdmin();
        validateEnrollment(request, adminOverride);

        ClientProfile client = clientRepository.findById(resolveClientId(request)).orElseThrow();
        Course course = courseRepository.findById(request.courseId()).orElseThrow();

        client.setAllowedNumOfTrainings(client.getAllowedNumOfTrainings() - 1);
        clientRepository.save(client);

        ClientCourseEnrollment enrollment = new ClientCourseEnrollment();
        enrollment.setClient(client);
        enrollment.setCourse(course);
        branchRepository.findById(request.branchId()).ifPresent(enrollment::setBranch);
        enrollment.setTotalAmountPaid(request.totalAmountPaid() != null ? request.totalAmountPaid() : BigDecimal.ZERO);
        enrollment.setEnrollmentDate(LocalDate.now());
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        int bufferDays = course.getBufferDays() != null ? course.getBufferDays() : 0;
        enrollment.setBufferDaysAllocated(bufferDays);
        enrollment.setBufferDaysUsed(0);
        enrollment = enrollmentRepository.save(enrollment);

        ScheduleQuery query = new ScheduleQuery(
                request.branchId(),
                request.assetType(),
                request.startDate(),
                request.preferredDays() != null ? request.preferredDays() : List.of(),
                request.hoursPerDay(),
                course.getTotalDays());
        List<TimeInterval> intervals = schedulerService.computeAvailableIntervals(query);

        List<ScheduleSlot> slots = new ArrayList<>();
        for (TimeInterval interval : intervals) {
            ScheduleSlot slot = new ScheduleSlot();
            slot.setEnrollment(enrollment);
            slot.setClient(client);
            slot.setBranchId(request.branchId());
            slot.setTitle(course.getName());
            slot.setStartDateTime(interval.start());
            slot.setEndDateTime(interval.end());
            slot.setType(ScheduleType.REGULAR_TRAINING);
            slot.setStatus(ScheduleStatus.PENDING);
            slots.add(slotRepository.save(slot));
        }

        for (int i = 0; i < bufferDays; i++) {
            ScheduleSlot bufferSlot = new ScheduleSlot();
            bufferSlot.setEnrollment(enrollment);
            bufferSlot.setClient(client);
            bufferSlot.setBranchId(request.branchId());
            bufferSlot.setTitle(course.getName() + " (Buffer)");
            bufferSlot.setStartDateTime(LocalDateTime.now());
            bufferSlot.setEndDateTime(LocalDateTime.now());
            bufferSlot.setType(ScheduleType.BUFFER_SESSION);
            bufferSlot.setStatus(ScheduleStatus.PENDING);
            slotRepository.save(bufferSlot);
        }

        events.publishEvent(new EnrollmentCreatedEvent(enrollment));
        return enrollment;
    }

    @Transactional
    public ScheduleSlot approveSlot(Long slotId, Long adminId, String assetId, Long trainerId) {
        ScheduleSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));
        TrainerProfile trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found."));
        slot.setStatus(ScheduleStatus.ACTIVE);
        slot.setResourceId(assetId);
        slot.setTrainer(trainer);
        slot = slotRepository.save(slot);
        events.publishEvent(new SlotApprovedEvent(slot));
        return slot;
    }

    @Transactional
    public ScheduleSlot rejectSlot(Long slotId, Long adminId, String reason) {
        ScheduleSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));
        slot.setStatus(ScheduleStatus.CANCELLED);
        slot.setRejectionReason(reason);
        slot = slotRepository.save(slot);

        ClientProfile client = slot.getClient();
        if (client != null) {
            client.setAllowedNumOfTrainings(client.getAllowedNumOfTrainings() + 1);
            clientRepository.save(client);
        }
        events.publishEvent(new SlotRejectedEvent(slot, reason));
        return slot;
    }

    @Transactional
    public ClientCourseEnrollment pauseEnrollment(Long enrollmentId, Long requesterId) {
        ClientCourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found."));
        if (!SecurityUtils.isAdmin() && !enrollment.getClient().getId().equals(requesterId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot pause another client's enrollment.");
        }
        enrollment.setStatus(EnrollmentStatus.PAUSED);
        return enrollmentRepository.save(enrollment);
    }

    private Long resolveClientId(EnrollmentRequest request) {
        if (request.clientId() != null) {
            return request.clientId();
        }
        // Resolve client_profiles.id from users.id via username lookup
        Long userId = SecurityUtils.currentUserId();
        com.mrk.training.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        ClientProfile profile = clientRepository.findByUsername(user.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Client not found."));
        return profile.getId();
    }

    /**
     * Admin-assigned training: creates enrollment + schedule slots + decrements allowance
     * all in a single transaction.
     */
    @Transactional
    public ClientCourseEnrollment adminAssignTraining(
            com.mrk.training.dto.enrollment.AdminAssignTrainingRequest request) {

        ClientProfile client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found."));
        if (client.getAllowedNumOfTrainings() == null || client.getAllowedNumOfTrainings() < 1) {
            throw new EnrollmentLimitException("No training allowance remaining for this client.");
        }

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found."));

        TrainerProfile trainer = null;
        if (request.trainerId() != null) {
            trainer = trainerRepository.findById(request.trainerId())
                    .orElseThrow(() -> new IllegalArgumentException("Trainer not found."));
        }

        // 1. Reduce client's allowed trainings
        client.setAllowedNumOfTrainings(client.getAllowedNumOfTrainings() - 1);
        clientRepository.save(client);

        // 2. Create enrollment
        ClientCourseEnrollment enrollment = new ClientCourseEnrollment();
        enrollment.setClient(client);
        enrollment.setCourse(course);
        branchRepository.findById(request.branchId()).ifPresent(enrollment::setBranch);
        enrollment.setTotalAmountPaid(request.totalAmountPaid() != null ? request.totalAmountPaid() : BigDecimal.ZERO);
        enrollment.setEnrollmentDate(LocalDate.now());
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        int bufferDays = course.getBufferDays() != null ? course.getBufferDays() : 0;
        enrollment.setBufferDaysAllocated(bufferDays);
        enrollment.setBufferDaysUsed(0);
        enrollment = enrollmentRepository.save(enrollment);

        // 3. Create schedule slots for each day in the provided ranges
        for (var rangeSlot : request.slots()) {
            LocalDate cursor = rangeSlot.startDate();
            while (!cursor.isAfter(rangeSlot.endDate())) {
                LocalDateTime slotStart = LocalDateTime.of(cursor, rangeSlot.startTime());
                LocalDateTime slotEnd = LocalDateTime.of(cursor, rangeSlot.endTime());

                ScheduleSlot slot = new ScheduleSlot();
                slot.setEnrollment(enrollment);
                slot.setClient(client);
                slot.setBranchId(request.branchId());
                slot.setTitle(course.getName());
                slot.setStartDateTime(slotStart);
                slot.setEndDateTime(slotEnd);
                slot.setType(ScheduleType.REGULAR_TRAINING);
                // Admin-assigned slots are directly ACTIVE (pre-approved)
                slot.setStatus(ScheduleStatus.ACTIVE);
                if (trainer != null) {
                    slot.setTrainer(trainer);
                }
                if (request.vehicleId() != null) {
                    slot.setResourceId(request.vehicleId());
                }
                slotRepository.save(slot);

                cursor = cursor.plusDays(1);
            }
        }

        // 4. Create buffer slots if course has buffer days
        for (int i = 0; i < bufferDays; i++) {
            ScheduleSlot bufferSlot = new ScheduleSlot();
            bufferSlot.setEnrollment(enrollment);
            bufferSlot.setClient(client);
            bufferSlot.setBranchId(request.branchId());
            bufferSlot.setTitle(course.getName() + " (Buffer)");
            bufferSlot.setStartDateTime(LocalDateTime.now());
            bufferSlot.setEndDateTime(LocalDateTime.now());
            bufferSlot.setType(ScheduleType.BUFFER_SESSION);
            bufferSlot.setStatus(ScheduleStatus.PENDING);
            slotRepository.save(bufferSlot);
        }

        events.publishEvent(new EnrollmentCreatedEvent(enrollment));
        return enrollment;
    }
}
