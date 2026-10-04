package com.homepets.backend.model;

public class HomePet {
    String name;
    String type;

    public HomePet(String name, String type) {
        this.name = name;
        this.type = type;
    }

    public String getName() { return name; }
    public String getType() { return type; }
}
