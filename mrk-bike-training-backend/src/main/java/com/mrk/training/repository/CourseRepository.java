package com.mrk.training.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mrk.training.model.Course;

public interface CourseRepository extends JpaRepository<Course, String> {

    List<Course> findByStatusIgnoreCase(String status);
}
