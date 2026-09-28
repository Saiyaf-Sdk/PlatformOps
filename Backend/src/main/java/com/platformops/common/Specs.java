package com.platformops.common;

import org.springframework.data.jpa.domain.Specification;

/** Small helpers so optional filters never need "(:p is null or …)" JPQL (which trips PostgreSQL typing). */
public final class Specs {
    private Specs() {}

    public static <T> Specification<T> all() {
        return (root, q, cb) -> cb.conjunction();
    }

    public static <T> Specification<T> eq(String attr, Object value) {
        return value == null ? null : (root, q, cb) -> cb.equal(root.get(attr), value);
    }

    public static <T> Specification<T> eqPath(String a, String b, Object value) {
        return value == null ? null : (root, q, cb) -> cb.equal(root.get(a).get(b), value);
    }

    /** Case-insensitive "contains" across one or more string attributes. */
    public static <T> Specification<T> containsAny(String text, String... attrs) {
        String t = Texts.blankToNull(text);
        if (t == null) return null;
        String like = "%" + t.toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        return (root, q, cb) -> cb.or(java.util.Arrays.stream(attrs)
                .map(a -> cb.like(cb.lower(root.<String>get(a)), like, '\\'))
                .toArray(jakarta.persistence.criteria.Predicate[]::new));
    }
}
