package org.astronarh.nes.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppStatRepository extends JpaRepository<AppStat, Long> {
}