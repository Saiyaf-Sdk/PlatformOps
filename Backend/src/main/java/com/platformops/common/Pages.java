package com.platformops.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class Pages {
    public static final int MAX_SIZE = 100;
    private Pages() {}

    /** Clamps client-supplied paging so nobody can request a million rows. */
    public static Pageable of(int page, int size, Sort sort) {
        int p = Math.max(0, page);
        int s = Math.min(Math.max(1, size), MAX_SIZE);
        return PageRequest.of(p, s, sort);
    }
}
