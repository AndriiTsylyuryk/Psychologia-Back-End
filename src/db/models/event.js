import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
    title: String,
    start: Date,
    end: Date,
    user
})