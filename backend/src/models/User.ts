import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
	email: string;
	username: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 3,
		maxlength: 20
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	}
}, {
	timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
