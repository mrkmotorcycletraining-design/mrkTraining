package com.mrk.training.converter;

import com.mrk.training.model.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        if (role == null) {
            return null;
        }
        return role.name();
    }

    @Override
    public Role convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return Role.valueOf(dbData);
    }
}
