package com.mrk.training.model;

/**
 * Days of the week enum with 2-letter storage code, 3-letter short name, and full name.
 * <p>
 * Storage in DB: comma-separated 2-letter codes (e.g., "Mo,Tu,We")
 * Display to user: full day name (e.g., "Monday, Tuesday, Wednesday")
 */
public enum DayOfWeekCode {
    Mo("Mon", "Monday"),
    Tu("Tue", "Tuesday"),
    We("Wed", "Wednesday"),
    Th("Thu", "Thursday"),
    Fr("Fri", "Friday"),
    Sa("Sat", "Saturday"),
    Su("Sun", "Sunday");

    private final String shortName;
    private final String fullName;

    DayOfWeekCode(String shortName, String fullName) {
        this.shortName = shortName;
        this.fullName = fullName;
    }

    /** 2-letter code used for DB storage (e.g., "Mo") */
    public String getCode() {
        return this.name();
    }

    /** 3-letter abbreviation (e.g., "Mon") */
    public String getShortName() {
        return shortName;
    }

    /** Full day name (e.g., "Monday") */
    public String getFullName() {
        return fullName;
    }

    /**
     * Lookup a DayOfWeekCode from its 2-letter code string.
     * @throws IllegalArgumentException if no match found
     */
    public static DayOfWeekCode fromCode(String code) {
        for (DayOfWeekCode day : values()) {
            if (day.name().equals(code)) {
                return day;
            }
        }
        throw new IllegalArgumentException("Unknown day code: " + code);
    }

    /**
     * Convert a comma-separated code string (e.g., "Mo,Tu,Fr") to full names (e.g., "Monday, Tuesday, Friday").
     */
    public static String codesToFullNames(String commaSeparatedCodes) {
        if (commaSeparatedCodes == null || commaSeparatedCodes.isBlank()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (String code : commaSeparatedCodes.split(",")) {
            if (!sb.isEmpty()) {
                sb.append(", ");
            }
            sb.append(fromCode(code.trim()).getFullName());
        }
        return sb.toString();
    }
}
