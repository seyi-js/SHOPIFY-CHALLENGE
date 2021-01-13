const mongoose = require( 'mongoose' );

const userSchema = new mongoose.Schema( {
    username: {
        type: String,
        unique: 'User name Exist.',
        required: true,
    },
    password: {
        type: String,
        required:true
    },
    images:[]
} );



const UserModel = mongoose.model( 'users', userSchema );

module.exports =  UserModel;