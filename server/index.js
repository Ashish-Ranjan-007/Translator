const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const path = require('path');
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
const Tesseract = require('tesseract.js');
const fs =require('fs');
const pdf =require('pdf-parse');
const translate = require('google-translate-api-x');
const https = require('https');
const serverless =require('serverless-http');
const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null,'files')
    },
    filename: (req,file, cb)=>{
        console.log();
        cb(null, Date.now()+ path.extname(file.originalname))
    }
})


const upload = multer({ storage: storage});
    
    
    // limits:{fileSize:408000}, fileFilter:(req, file, cb) => {
    // if (file.mimetype == "Image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
    //     cb(null, true);
    //   } else {
      
    //     cb('Only .png, .jpg and .jpeg format allowed!', false);
    //   }
    // } });

    // if(file.mimetype=="application/pdf"){

    // } else if (file.mimetype== "application/msword" || file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    // ){

    // }



app.set('view engine', 'ejs');

app.get('/', (req,res)=>{


   return res.render('app', { });

})

// app.get('/upload', (req,res)=>{
//     res.render("file uploaded");
// })
app.post('/upload', upload.single('file'), imagetoText);



async function imagetoText (req,res){
    const bodydata= (req.body["inputoption"]);
    
    console.log("value")
    console.log(bodydata);
    const filename = req.file.originalname.split(".");
    const fileextension = filename[filename.length-1];
    console.log(fileextension);

 

  if(fileextension=="jpg" || fileextension=="png" || fileextension=="bmp" || fileextension=="pbm" || fileextension=="webp" ){
  
    // console.log(req.file, req.body);
    const sendback = await Tesseract.recognize(
        `./files/${req.file.filename}`,
        'eng',
        // { logger: m => console.log(m) }
      ).then(({ data: { text } }) => {
        console.log(text);
        
        translatemech(text);
     
        // translate('Ik spreek Engels', {to: 'en'}).then(res => {
        //     console.log(res.text);
        //     //=> I speak English
        //     console.log(res.from.language.iso);
        //     //=> nl
        // }).catch(err => {
        //     console.error(err);
        // });  

    })

    async function translatemech(text){
    const translatedText = await translate(text, {to: bodydata});

    console.log(translatedText.text); //=> I speak English
    console.log(translatedText.from.language.iso);  //=> nl
    return res.render('preview', { extractedText:text , translatedText:translatedText.text })
    }

    

}else {
    return res.status(400).render('preview' ,{ extractedText:"File type not supported" , translatedText: "File type not supported" })
}

app.get("/download", (req,res)=>{

        
    const url = req.filename;
  
    https.get(url,(res) => {
    // Image will be stored at this path
    const path = `${__dirname}/files/img.jpeg`; 
    const filePath = fs.createWriteStream(path);
    res.pipe(filePath);
    filePath.on('finish',() => {
        filePath.close();
        console.log('Download Completed'); 
    })
})

})
 


}



// then( out=> console.log(out));
app.listen(4000, ()=>{console.log("server running at 4000")})