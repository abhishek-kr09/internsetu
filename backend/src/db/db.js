//mongodb connection and schema definition
const mongoose=require('mongoose');

const connectDB=async()=>{ 
    try{
       // Just pass the URI
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch(err){
        console.error(err.message);
        process.exit(1);
    }  
}

module.exports=connectDB;