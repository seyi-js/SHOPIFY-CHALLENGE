const mongoose = require( 'mongoose' );

const userSchema = mongoose.Schema( {
    username: {
        type: String,
        unique: 'User name Exist.',
        required: true,
    },
    password: {
        type: String,
        required:true
    }
} );

const imageSchema = mongoose.Schema( {
    
} );

const UserModel = mongoose.model( 'users', userSchema );

module.exports = { UserModel };