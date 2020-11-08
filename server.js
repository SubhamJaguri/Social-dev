const express = require('express');
const connectDB = require('./config/db');
const app = express();
const path = require('path');

//connect Data Base
connectDB();

//Init Middle ware::::::
app.use(express.json({extended:false}));
app.use(express.static("uploads"));


//Define Routes::::::::::
app.use('/api/users',require('./routes/api/users'));
app.use('/api/auth',require('./routes/api/auth'));
app.use('/api/profile',require('./routes/api/profile'));
app.use('/api/posts',require('./routes/api/posts'));

//Serve Static Assest In Production

if(process.env.NODE_ENV === 'production'){
    //Set Static Folder
    app.use(express.static('client/build'));

    app.get('*',(req,res) => {
        res.sendFile(path.resolve(__dirname,'client','build','index.html'));
    })
}


const PORT = process.env.PORT || 5000;       //This will search for env.PORT and if not found it will be launched in port 5000
                                            //The env.PORT is used for Heroku 


app.listen(PORT,()=>console.log(`Server Started on port ${PORT}`));