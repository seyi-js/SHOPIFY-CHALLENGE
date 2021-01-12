const express = require( 'express' );
const Router = express.Router();
const { UserModel } = require( '../../dbModels/index' );
const bcrypt = require( "bcryptjs" );
const Crypto = require( 'crypto' );

//@route POST api/login
//@desc  LOGIN
//@ccess  Public
R.post( '/login', async( req, res ) => {
    const { username, password } = req.body;

    
    if ( !username || !password ) {
        
        res.json( { message: 'Please enter all fields.', code: 400 } );

    };

    try {
        let user = UserModel.findOne( { username } );
        if ( !user ) {
            res.json( { message: 'Invalid credentials.', code: 400 } );
            
        };
    } catch (err) {
        res.json('Internal Server Error.')
    }
} );



module.exports = Router;