package com.homepets.backend.model;

import java.time.LocalDate;

public class RoomChore {
    String choreId;
    String title;
    int rewardPoints;
    boolean enabled;
    private LocalDate lastCompletedDate;

    public RoomChore(String choreId, String title, int rewardPoints, boolean enabled) {
        this.choreId = choreId;
        this.title = title;
        this.rewardPoints = rewardPoints;
        this.enabled = enabled;
    }

    public String getChoreId() { return choreId; }
    public String getTitle() { return title; }
    public int getRewardPoints() { return rewardPoints; }
    public boolean isEnabled() { return enabled; }
    public LocalDate getLastCompletedDate() { return lastCompletedDate; }

    public boolean isCompletedOn(LocalDate date) {
        return date.equals(lastCompletedDate);
    }

    public void completeOn(LocalDate date) {
        lastCompletedDate = date;
    }

    public void resetCompletion() {
        lastCompletedDate = null;
    }
}
