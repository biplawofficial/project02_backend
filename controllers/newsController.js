
//importing all the necessary modules that are required.
const NewsTable = require('../models/latestNew');


/*
This api will insert the news to the news collection.The api is restricted to the admin only as we are checking the 
role from the jwt token.The api is also accepting the date and news in the object when requested.
*/
addNews = async(req,res)=>{
    if(req.data.user.role === "admin"){
    const news = new NewsTable(
        {
            date: req.body.date,
            news: req.body.news
        }
    );
    try {
        const savedNews = await news.save();
        res.status(200).json({ status: 200 });
    } catch (error) {
        res.status(500).json({ status: 500 });
    }
}
else{
    res.status(400).json({ status: 401 });
}
}

/*
This api will return all the news that are saved in news collection.It is open api as it is used without login.
*/
getNews = async(req,res)=>{
    try{
    const news = await NewsTable.find();
    res.status(200).json({ status: 200, latestnewsdata: news });
    }
    catch(error){
        res.status(500).json({ status: 500 });
    }
}




// exporting all the functions so that it can be used in adminRoutes.
module.exports={
    addNews,
    getNews
}