package com.mrk.training.web.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrk.training.model.Course;
import com.mrk.training.repository.CourseRepository;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    public CourseController(CourseRepository courseRepository, ObjectMapper objectMapper) {
        this.courseRepository = courseRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<Course> list(@RequestParam(required = false, defaultValue = "All") String status) {
        if ("All".equalsIgnoreCase(status)) {
            return courseRepository.findAll();
        }
        return courseRepository.findByStatusIgnoreCase(status);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Course> createMultipart(
            @RequestPart("course") String courseJson,
            @RequestPart(value = "templateImage", required = false) MultipartFile templateImage) throws IOException {

        Course course = objectMapper.readValue(courseJson, Course.class);
        if (course.getId() != null && courseRepository.existsById(course.getId())) {
            throw new IllegalArgumentException("Training ID '" + course.getId() + "' already exists.");
        }
        if (course.getStatus() == null || course.getStatus().isBlank()) {
            course.setStatus("ACTIVE");
        }
        if (templateImage != null && !templateImage.isEmpty()) {
            course.setTemplateImage(templateImage.getBytes());
        }
        if(course.getStartDate() == null) {
            course.setStartDate(LocalDate.now());
        }
        return ResponseEntity.status(201).body(courseRepository.save(course));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Course> create(@RequestBody Course course) {
        if (course.getId() != null && courseRepository.existsById(course.getId())) {
            throw new IllegalArgumentException("Training ID '" + course.getId() + "' already exists.");
        }
        if (course.getStatus() == null || course.getStatus().isBlank()) {
            course.setStatus("ACTIVE");
        }
        return ResponseEntity.status(201).body(courseRepository.save(course));
    }

    @PutMapping("/{id}")
    public Course update(@PathVariable String id, @RequestBody Course course) {
        course.setId(id);
        return courseRepository.save(course);
    }

    @PutMapping(value = "/{id}/template", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Course> updateTemplate(
            @PathVariable String id,
            @RequestPart("templateImage") MultipartFile templateImage) throws IOException {

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found."));
        course.setTemplateImage(templateImage.getBytes());
        return ResponseEntity.ok(courseRepository.save(course));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found."));
        course.setStatus("INACTIVE");
        courseRepository.save(course);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found."));
        course.setStatus("ACTIVE");
        courseRepository.save(course);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!courseRepository.existsById(id)) {
            throw new IllegalArgumentException("Course not found.");
        }
        courseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
