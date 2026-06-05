package com.mrk.training.web.controller;

import com.mrk.training.model.Course;
import com.mrk.training.repository.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @GetMapping
    public List<Course> list() {
        return courseRepository.findAll();
    }

    @PostMapping
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public Course create(@RequestBody Course course) {
        return courseRepository.save(course);
    }

    @PutMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public Course update(@PathVariable String id, @RequestBody Course course) {
        course.setId(id);
        return courseRepository.save(course);
    }

    @PutMapping("/{id}/image")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Course> updateImage(@PathVariable String id, @RequestBody ImageUpdate body) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found."));
        course.setImageUrl(body.imageUrl());
        return ResponseEntity.ok(courseRepository.save(course));
    }

    public record ImageUpdate(String imageUrl) {}
}
