package org.astronarh.nes.service;

import org.astronarh.nes.jpa.AppStat;
import org.astronarh.nes.jpa.AppStatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AppStatService {
    @Autowired
    private AppStatRepository appStatRepository;

    public void saveStat(String timestamp, String userId, String eventType, String eventData) {
        AppStat stat = new AppStat();
        stat.setTimestamp(timestamp);
        stat.setUserId(userId);
        stat.setEventType(eventType);
        stat.setEventData(eventData);
        appStatRepository.save(stat);
        System.out.println("Статистика сохранена в БД.");
    }
}