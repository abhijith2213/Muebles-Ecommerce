const mongoClient = require('mongodb').MongoClient

const state={
    db:null
}

module.exports.connect=function(done){
    const url= 'mongodb+srv://abhijithas2213:abhi123@cluster0.mpsgwoj.mongodb.net/test';
    const dbname = 'ecommerce'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db= data.db(dbname)
        done()
    })
}


module.exports.get= function(){
    return state.db
}