import { createRequire } from "module";
import { speak } from 'google-translate-api-x';
import { writeFileSync } from 'fs';

const require = createRequire(import.meta.url);
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const path = require('path');
const server = http.createServer(app);
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const translate = require('google-translate-api-x');
const fs = require('fs');
const https = require('https');
const serverless =require('serverless-http');
const router = express.Router();
const PDFDocument = require('pdfkit');
const axios =require('axios');
const { createAudioFile } = require('simple-tts-mp3');
const docxParser = require('docx-parser');


app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));


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
    



app.set('view engine', 'ejs');

app.get('/', (req,res)=>{

   return res.render('app', { });

})


app.get('/download_pdf', async (req,res)=>{

    const filepath = "./tempStore/output.pdf";
    const filename = "output.pdf";
    console.log("download pdf api called")
    // res.setHeader('Content-disposition', 'attachment; filename=output.pdf');

    return res.download(filepath);
   
//    setTimeout(() => {
//     fs.unlink("./tempStore/output.pdf", ()=>{console.log("file removed")})
//    }, 9999);
  

})

app.get('/download_mp3', async(req,res)=>{

    const filepath = "./tempStore/output.mp3";
    const filename = "output.mp3";
    console.log("download mp3 api called")
    // res.setHeader('Content-disposition', 'attachment; filename=output.pdf');
    res.download(filepath);

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
  
    console.log(req.file, req.body);
    const sendback = await Tesseract.recognize(
        `./files/${req.file.filename}`,
        'eng',
        // { logger: m => console.log(m) }
      ).then(({ data: { text } }) => {
        console.log(text);
        
       translatemech(text);
                   
    })

    async function translatemech(text){
    const translatedText = await translate(text, {to: (bodydata.toLowerCase())});
    
    console.log("TRANSLATED ===========================")
    console.log(translatedText.text); //=> I speak English
    // console.log(translatedText.from.language.iso);  //=> nl

    const doc = new PDFDocument();

    doc.font('./TiroDevanagariHindi-Regular.ttf');
    doc.font('./SakalBharati.ttf');
    doc.text(translatedText.text, 100, 100);
    doc.pipe(fs.createWriteStream('./tempStore/output.pdf'));
    doc.end();
    // await fs.unlink(`./files/${req.file.filename}`, ()=>{console.log("file removed")})


    

    createAudioFile(translatedText.text, './tempStore/output', (bodydata.toLowerCase()));

    return res.render('preview', { extractedText:text ,translatedText:translatedText.text })
    }   

}else if(fileextension=="pdf"){
    let dataBuffer = fs.readFileSync(`./files/${req.file.filename}`);
    pdf(dataBuffer).then(function(data) {
        console.log(data.text); 
        });
        
        res.render('preview', {extractedText:data.text
            ,translatedText:translatedText.text})


        }

    else {
    return res.status(400).render('preview' ,{ extractedText:"File type not supported" , translatedText: "File type not supported" })
    }

}
app.listen(4000, ()=>{console.log("server running at 4000")})

// app.get("/download", (req,res)=>{

        
//     const url = req.filename;
  
//     https.get(url,(res) => {
//     // Image will be stored at this path
//     const path = `${__dirname}/files/img.jpeg`; 
//     const filePath = fs.createWriteStream(path);
//     res.pipe(filePath);
//     filePath.on('finish',() => {
//         filePath.close();
//         console.log('Download Completed'); 
//     })
// })

// })
 






// then( out=> console.log(out));
