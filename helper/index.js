const crypto = require( 'crypto' )
const jwt = require( 'jsonwebtoken' );
const bcrypt = require( "bcryptjs" );
let privateKey='245363465765ybhytniyuom78o78987cnddsfg576uyhvgtyt'
//@desc Genarate Json Web Tokens
const generateJwtToken = ( id ) => {
    const token = jwt.sign(
        { id },
        `${ privateKey }`,
        { expiresIn: 60 * 1000 * 60 * 24 } )//Expires in 24hrs 
       
    return token;
};


//@desc Verify Json Web Tokens

const verifyToken = ( req, res, next ) => {
    const token = req.header( 'x-auth-token' );
    if ( !token ) {
        
        return res.json({message:'No token, authorization denied', code:401}  )
    } else {
        if ( token ) {
            try {
                const decoded = jwt.verify( token, privateKey );
                req.user = decoded;
                // decoded;
                // console.log( decoded )
                next();
            } catch ( e ) {
                // req.JWTerrorMessage = e.message;
               console.log(e)
        return res.json({message:'Invalid Token', code:403}  )

                
            }
        }
    }
};

//@desc Gen Hash
const genHash = ( data ) => {
    let hash;
    var salt = bcrypt.genSaltSync( 10 );
    hash = bcrypt.hashSync( data, salt );
    
    return hash;
};
module.exports={verifyToken,generateJwtToken,genHash}