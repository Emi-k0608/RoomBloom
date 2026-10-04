package com.homepets.backend.model;

import java.util.List;

public class HomePetRoom {
    String roomId;
    String roomName;
    HomePet pet;
    List<RoomChore> chores;
    int availablePoints;

    public HomePetRoom(String roomId, String roomName, HomePet pet, List<RoomChore> chores, int availablePoints) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.pet = pet;
        this.chores = chores;
        this.availablePoints = availablePoints;
    }

    public String getRoomId() { return roomId; }
    public String getRoomName() { return roomName; }
    public HomePet getPet() { return pet; }
    public List<RoomChore> getChores() { return chores; }
    public int getAvailablePoints() { return availablePoints; }

    public void addPoints(int points) {
        availablePoints += points;
    }

    public boolean spendPoints(int points) {
        if (availablePoints < points) {
            return false;
        }
        availablePoints -= points;
        return true;
    }

    public void resetPoints() {
        availablePoints = 0;
    }
}
