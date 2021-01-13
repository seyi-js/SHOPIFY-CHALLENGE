const express = require( 'express' );
const {upload} = require('../../server')
const Router = express.Router();
const UserModel = require('../../dbModels/index')
const bcrypt = require( "bcryptjs" );
const {generateJwtToken,verifyToken,genHash} = require('../../helper/index')
const Grid = require('gridfs-stream')
const mongoose = require( 'mongoose' );
const Crypto = require('crypto')
mongoose.set( 'useCreateIndex', true );


//DB Config

let db='mongodb://localhost:27017/shopify'



let gfs = {};

let dataBase =async () => {
  try {
    let connection = await mongoose.connect( db, { useUnifiedTopology: true, useNewUrlParser: true } );
    Grid.mongo = mongoose.mongo;
    console.log( 'Connected to Shopify Database' );
    gfs = Grid( connection.connection.db);
      gfs.collection( 'uploads' );
      
  } catch (err) {
      console.log( err );
    };
 };
 dataBase();

//@route POST api/login
//@desc  LOGIN
//@ccess  Public
Router.post( '/login', async( req, res ) => {
    const { username, password } = req.body;

    
    if ( !username || !password ) {
        
        res.json( { message: 'Please enter all fields.', code: 400 } );

    };

    try {
        let user = await UserModel.findOne( { username } );
        if ( !user ) {
           return res.json( { message: 'Invalid credentials.', code: 400 } );
            
        };
        //Validate Password
        // console.log(user)
        let isMatch = bcrypt.compareSync( password, user.password );
        if ( !isMatch ) {
            return res.json( { message: 'Invalid credentials', code: 400 } );
        };

        //Generate Jwt
        const JWTtoken = await generateJwtToken(  user._id );
        return res.status( 200 ).json( {JWTtoken} )
    } catch (err) {
        res.json( 'Internal Server Error.' );
        console.log( err );
    }
} );

//@route POST api/register
//@desc  Register Users
//@access  Public

Router.post( '/register', async ( req, res ) => {
    const { username, password } = req.body;

    
    if ( !username || !password ) {
        
        res.json( { message: 'Please enter all fields.', code: 400 } );

    };
  
    // console.log(req.body)
    try {
        
        let user = await UserModel.findOne( { username } );
        // console.log(user)
    if ( user) {
                
        
        return res.json({message:'Choose a different email', code:400}  )
        }
        //Generate password Hash
        let passwordHash = genHash( password );
        
        const newUser = new UserModel( {
            username,
            password: passwordHash
        } );
        
       let regUser = await newUser.save();
        //Generate Jwt
        const JWTtoken = await generateJwtToken(  regUser._id );
        return res.status( 200 ).json( { JWTtoken } );
        
    } catch (err) {
        console.log(err)
        res.json( 'Internal server error' );
    };
} );

//@route POST api/upload
//@desc  upload image
//@access  Private
Router.post( '/upload', verifyToken, upload.array('file'),  async( req, res ) => {
    
    if ( req.files === undefined || req.files === null ) {
        return res.status( 400 ).json( { msg: 'No file uploaded' } );
    }
    
    try {
        let user = await UserModel.findById( req.user.id );
        
        let allFiles = [];
    for ( let i = 0; i < req.files.length; i++ ){
        let filename = req.files[ i ].filename;
        let filestopush = {
            _id: req.files[ i ].id,
            filename,
            content_type:req.files[i].contentType,
            url: "http://" + req.headers.host + "/api/download/" + filename,
            upload_date:Date.now()
        }
        allFiles.push( filestopush );

        //Save Images for the particular user
        user.images.push( filestopush );
    };
    let files = {
        status: 'ok',
        code: 200,
        files: allFiles,
        count: req.files.length
    };
        await user.save();
    res.json( files );
        
    } catch (err) {
        console.log(err)
        res.json('Internal server error.')
    }
    // console.log(req.files)
} );

//@route GET api/download/:filename
//@desc  view image
//@access  Private
Router.get( '/download/:filename', verifyToken, ( req, res ) => {
    let { filename } = req.params;
    if ( !filename ) {
        res.json({message:'Invalid Request.',code:400})
    }
    var readStream = gfs.createReadStream(filename ).pipe( res );
    readStream.on( 'close', () => {
            
        console.log( 'done' )
    
    } );

readStream.on( 'error', (err) => {
    res.json('File does not exist.')
});
});

//@route GET api/myfiles
//@desc  Get all files for a user
//@access  Private
Router.get( '/myfiles', verifyToken, async ( req,res )=> {
    try{
        let user = await UserModel.findById(req.user.id);
    let files = user.images;
        res.json( files );
    }catch(err){
        console.log(err);
        res.json('Internal server error.')
    }
} );

//@route DELETE api/delete
//@desc  delete image
//@access  Private
Router.delete( '/delete',verifyToken,  async( req, res ) => {
    let { ids } = req.body;
    if ( !ids || ids.length === 0) {
        res.json( { message: 'Invalid Request.', code: 400 } );
    }

    try {

        
        let user = await UserModel.findById(req.user.id);
        let arr = [...user.images];
        
        //Delete Images from user object
        
var result = arr.map((i, idx)=>{
    
    return arr[idx] = ids.includes(i._id.toString())? undefined : arr[idx]
 }).filter(i=>i)
 
 
        user.images = result;
        await user.save();
    //Delete from Files Collections
    for ( let i = 0; i < ids.length; i++){
        let options = {
            _id: ids[i],
            root:'uploads'
        };
      
       await gfs.remove(options);
        // console.log(file)
    }
    res.json( { message: `${ids.length} Files deleted succesfully`, status: 'ok', code: 200 } );
    } catch (err) {
        console.log(err)
    }
} );


// console.log(res)

// let arr =[{"_id":"5ffdcfda925e461934a093f1","filename":"da1b648e7e0eecbe61c79ad790b256dc.png","content_type":"image/png","url":"http://localhost:5703/api/download/da1b648e7e0eecbe61c79ad790b256dc.png","upload_date":1610469339248},{"_id":"5ffdcfda925e461934a09413","filename":"b4922c7cb3abdfa4210fb62dcde272f2.png","content_type":"image/png","url":"http://localhost:5703/api/download/b4922c7cb3abdfa4210fb62dcde272f2.png","upload_date":1610469339250},{"_id":"5ffdcfda925e461934a09414","filename":"a33e232eab5f135088175e498a834265.jpg","content_type":"image/jpeg","url":"http://localhost:5703/api/download/a33e232eab5f135088175e498a834265.jpg","upload_date":1610469339251},{"_id":"5ffde33c16c76e359015e8ab","filename":"fec2b7fcaf333ef46b1a97a927929589.png","content_type":"image/png","url":"http://localhost:5703/api/download/fec2b7fcaf333ef46b1a97a927929589.png","upload_date":1610474301670},{"_id":"5ffde33d16c76e359015e8cd","filename":"2c12d7ed9adbd5358a8de807dd081f91.png","content_type":"image/png","url":"http://localhost:5703/api/download/2c12d7ed9adbd5358a8de807dd081f91.png","upload_date":1610474301672},{"_id":"5ffde33d16c76e359015e8ce","filename":"42e38ce227d535ed3842be2fa62b2b1b.jpg","content_type":"image/jpeg","url":"http://localhost:5703/api/download/42e38ce227d535ed3842be2fa62b2b1b.jpg","upload_date":1610474301673}];

// // var arr= [{id:1, name: "foo"}, {id:2, name: "bar"}, {id:3, name:"not to be deleted"}];

// var idsToDelete = ['5ffdcfda925e461934a093f1'];

// var res = arr.map((i, idx)=>{
//     return arr[idx] = idsToDelete.includes(i._id)? undefined : arr[idx]
//  }).filter(i=>i)
 
//  console.log(typeof(arr[1]._id))

module.exports = Router;