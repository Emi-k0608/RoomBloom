package com.homepets.backend.model;

public enum RewardEnum {
    // unlock item
    RUG("rug", "Colorful Rug", 30),
    BIG_BEAVER("big-beaver", "Big Beaver", 50);

    // each of items id
    private final String id;
    // each of items name
    private final String name;
    // each of items cost
    private final int cost;

    RewardEnum(String id, String name, int cost) {
        this.id = id;
        this.name = name;
        this.cost = cost;
    }

    // getter
    public String getId() {
        return id;
    }
    public String getName() {
        return name;
    }
    public int getCost() {
        return cost;
    }

    // exchange enum
    public static RewardEnum getById(String id) {
        for (RewardEnum reward : RewardEnum.values()) {
            if (reward.getId().equalsIgnoreCase(id)) {
                return reward;
            }
        }
        return null;
    }
}
