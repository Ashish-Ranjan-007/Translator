import { createRequire } from "module";
import { writeFileSync } from 'fs';
import express, { Router } from 'express';
import serverless from 'serverless-http';
import HttpsProxyAgent from 'http-proxy-agent';
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);
const app = express();
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const path = require('path');
const server = http.createServer(app);
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const { translate} = require('google-translate-api-x');
const fs = require('fs');
const https = require('https');

const router = express.Router();
const PDFDocument = require('pdfkit');
const axios =require('axios');
const { createAudioFile } = require('simple-tts-mp3');
const docxParser = require('docx-parser');
var textract = require('@nosferatu500/textract');




app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));


// ------SETTING STORAGE VARIABLE ------//
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null,'files') // uploaded files are stored here
    },
    filename: (req,file, cb)=>{
        console.log();
        cb(null, Date.now()+ path.extname(file.originalname)) // setting name of the uploaded folder
    }
})
const upload = multer({ storage: storage});
    
// ------LANDING PAGE API ------//

app.set('view engine', 'ejs');

app.get('/', (req,res)=>{

   return res.render('app', { }); // main page 

})


// ------UPLOAD FILE API ------//

app.post('/upload', upload.single('file'), checkfile);

// ------DOWNLOAD PDF API ------//

app.get('/download_pdf/:folder/:path', async (req,res)=>{
    const path= req.params['path'];
    const folder = req.params['folder'];
    console.log(path)
    const filepath = `${folder}/${path}.pdf`;
    console.log(filepath)

    console.log("download pdf api called")
    return res.download(filepath);
   
//    setTimeout(() => {
//     fs.unlink("./tempStore/output.pdf", ()=>{console.log("file removed")})
//    }, 9999);  

})

// ------DOWNLOAD AUDIO API ------//

app.get('/download_mp3/:folder/:path', async(req,res)=>{
    const path= req.params['path'];
    const folder = req.params['folder'];
    const filepath = `${folder}/${path}.mp3`;
    console.log("download mp3 api called")
    return res.download(filepath);

})
// ------DOWNLOAD TEXT API ------//
app.get('/download_txt/:folder/:path', async(req,res)=>{
    const path= req.params['path'];
    const folder = req.params['folder'];
    const filepath = `${folder}/${path}.txt`;
    console.log("text file", filepath);
    console.log("download txt api called")
    return res.download(filepath);

})

// ----------------Audio Streaming -----------------------------------// 
app.get('/play/:folder/:name', (req,res)=>{
const name = req.params['name'];
const folder = req.params['folder'];
console.log("name: ", name,"folder", folder)
 const path = `./tempStore/${name}`

  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/,'').split('-');
    // console.log(`range DAta ===  ${range}`);
    // console.log(parts);
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(path, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mp3',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mp3',
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
})




//--------- FUNCTION TO TRANSLATE TEXT ---------// 
async function translatemech(text, lang_opt){
    const temptranslatedText = await translate(text, {to: (lang_opt.toLowerCase()),forceBatch: true,rejectOnPartialFail:false
        ,requestFunction: fetch});
    
    console.log("TRANSLATED line 97===========================")
    console.log( temptranslatedText);
    const translatedText = await temptranslatedText.text;
    console.log(translatedText);
    return translatedText;
}

//--------- FUNCTION TO SAVE TEXT TO PDF ---------// 
async function text_to_pdf(translatedText, fullpath){
    console.log("fullpath pdf",fullpath)
    const doc = new PDFDocument();
 
    doc.font('./TiroDevanagariHindi-Regular.ttf');
    doc.font('./SakalBharati.ttf');
    doc.text(translatedText, 100, 100);
    doc.pipe(fs.createWriteStream(`${fullpath}.pdf`));
    doc.end();

    // await fs.unlink(`./files/${req.file.filename}`, ()=>{console.log("file removed")})
}

//--------- FUNCTION TO CONVERT TEXT TO AUDIO ---------// 
async function make_audio(translatedText,lang_opt, fullpath){
    console.log("fullpath audio ",fullpath)
   await createAudioFile(translatedText, `${fullpath}`, (lang_opt.toLowerCase()));

 }
//--------- FUNCTION TO MAKE TEXT FILE ---------// 

 async function to_text(translatedText,fullpath){
    console.log("fullpath ",fullpath)
    try{
        let fileaccess = `${fullpath}.txt`;
        await fs.writeFileSync(fileaccess,translatedText )
    }catch(err){
        console.error(err);
    }

 }
// -------------Function for text split --------------------//
async function sentence_splitter(){
    if(text.length >= 4999){

        var sentence = await text.replace(/(\.+|\:|\!|\?)(\"*|\'*|\)*|}*|]*)(\s|\n|\r|\r\n)/gm, "$1$2|").split("|");
    // console.log("sentence-----------------", sentence);
        var chunks =[]
        let tempchunk =  await translate(sentence, {to: lang_opt.toLowerCase(), forceTo: true, rejectOnPartialFail: false
         //requestOptions:{agent: new HttpsProxyAgent('https://46.219.80.142')}//
        });
    // console.log("tempcheck----------------------------", tempchunk) ;
    tempchunk.forEach(element => {
        chunks.push(element.text);    
        console.log(element.text);      
        });
    
        para = await chunks.join('');
    // console.log("para------------------------",para);
        translatedText = para;
        res.render('preview', { extractedText:text, translatedText:para})
    } else {

            extractedText= data.text;
           // console.log("LINE 158====================",extractedText);
            translatedText = await translatemech(extractedText,lang_opt);
           // console.log("line 160====================", translatedText);
            res.render('preview', { extractedText:extractedText, translatedText:translatedText})
        }

}


// ------FUNCTION TO CHECK THE FILE TYPE VIA EXTENSION ------//

async function checkfile (req,res){
    const lang_opt= (req.body["inputoption"]);
    console.log("value")
    console.log(lang_opt);
    const filename = req.file.originalname.split(".");
    const file_extension = filename[filename.length-1];
    console.log(file_extension);
    var translatedText="initial";
    var extractedText ="initial";
    var newextract ="";
    var newtranslate ="";
    const filespecifier = req.file.filename.split(".");
    const fullpath = `./tempStore/${filespecifier[0]}`;
    console.log(fullpath);

 
    try { 
    if(file_extension=="jpeg" || file_extension=="jpg" || file_extension=="png" || file_extension=="bmp" || file_extension=="pbm" || file_extension=="webp" ){
        
        console.log(req.file, req.body);
        const sendback = await Tesseract.recognize(`./files/${req.file.filename}`,'eng'
        // { logger: m => console.log(m) }
            ).then(async ({ data: { text } }) => {
                 // console.log(text);
                extractedText = text;

                translatedText = await translatemech(text, lang_opt );   
                // console.log("inside then", translatedText);
                res.render('preview', { extractedText:extractedText ,translatedText:translatedText , fullpath: fullpath})            
                })

        // console.log(sendback.data.text, '----------sendback--------------')
        
        setTimeout(async ()=>{
            await make_audio(translatedText,lang_opt, fullpath);
            await to_text(translatedText, fullpath);
            await text_to_pdf(translatedText, fullpath);
        }, 1000)    
      
    }else if(file_extension=="pdf"){

  

            let dataBuffer = fs.readFileSync(`./files/${req.file.filename}`);
          
                await pdf(dataBuffer).then(async function(data) {

            extractedText= data.text;
        // ===============================
            var para="";
            var text= await data.text;
            if(text.length >= 4999){

                    var sentence = await text.replace(/(\.+|\:|\!|\?)(\"*|\'*|\)*|}*|]*)(\s|\n|\r|\r\n)/gm, "$1$2|").split("|");
            // console.log("sentence-----------------", sentence);
                    var chunks =[]
                    let tempchunk =  await translate(sentence, {to: lang_opt.toLowerCase(), forceTo: true, rejectOnPartialFail: false
                 //requestOptions:{agent: new HttpsProxyAgent('https://46.219.80.142')}//
            
                        });
            // console.log("tempcheck----------------------------", tempchunk) ;
                    tempchunk.forEach(element => {
                        chunks.push(element.text);    
                       // console.log(element.text);
                        });
            
                    para = await chunks.join('');
            // console.log("para------------------------",para);
                    translatedText = para;
                    res.render('preview', { extractedText:text, translatedText:para, fullpath: fullpath})
                } 
                else {
                    extractedText= data.text;
                   // console.log("LINE 172====================",extractedText);
                    translatedText = await translatemech(extractedText,lang_opt);
                   // console.log("line 174====================", translatedText);
                    res.render('preview', { extractedText:extractedText, translatedText:translatedText, fullpath: fullpath })
                    }


              });
                    // setTimeout(async ()=>{
                    //     await to_text(translatedText);
                    //     await text_to_pdf(translatedText);
                    //     await make_audio(translatedText,lang_opt);
                    // }, 1000)
         //   console.log("line 179 ", extractedText)

            setTimeout(async ()=>{
                    await make_audio(translatedText,lang_opt, fullpath);
                    await to_text(translatedText, fullpath);
                    await text_to_pdf(translatedText, fullpath);
                    }, 1000)
                   

          

    }else if(file_extension=="docx" || file_extension=="csv" || file_extension=="doc" || file_extension=="html" || file_extension=="odt" || file_extension=="rtf" || file_extension=="wps" || file_extension=="xml" || file_extension=="xps"  ){

        textract.fromFileWithPath(`./files/${req.file.filename}`, async ( error, text )=>{
        // console.log(extractedText, "initial wala")
        // console.log("text from doc",text);
        // console.log(text.length);
        var para="";
            if(text.length >= 4999){
                    var sentence = await text.replace(/(\.+|\:|\!|\?)(\"*|\'*|\)*|}*|]*)(\s|\n|\r|\r\n)/gm, "$1$2|").split("|");
                    console.log("sentence-----------------", sentence);
                    var chunks =[]
                    let tempchunk =  await translate(sentence, {to: lang_opt.toLowerCase(), forceTo: true, rejectOnPartialFail: false,
                        //  requestOptions:{agent: new HttpsProxyAgent('https://46.219.80.142')}//
                    
                        });
                    console.log("tempcheck----------------------------", tempchunk) ;
                    tempchunk.forEach(element => {
                        try{
                            chunks.push(element.text);  
                          //  console.log(element.text);
                        }
                        catch (e){
                            console.log(e);
                        }           
                    });
            
                     para = await chunks.join('');
                    console.log("para------------------------",para);
                    translatedText = para;
                    res.render('preview', { extractedText:text, translatedText:para , fullpath: fullpath}) 
        
            }else{
            
                translatedText = await translatemech(text,lang_opt);

                // console.log("--------------line 202-------------", extractedText,"--------------------line 202---------------", translatedText);
                newextract = await text;
                newtranslate = await translatedText; 
                console.log("fullpath-----------", fullpath)
                res.render('preview', { extractedText:newextract, translatedText:translatedText, fullpath: fullpath}) 
            }   


        setTimeout(async ()=>{
            await make_audio(translatedText ,lang_opt, fullpath);
            await to_text(translatedText, fullpath);
            await text_to_pdf(translatedText, fullpath);
        }, 0)

        });

        

       

    } else{
        return res.status(400).render('preview' ,{ extractedText:"File type not supported" , translatedText: "File type not supported" })
    }
} catch(e){console.log(e)}

}



app.listen(4000, ()=>{console.log("server running at 4000")})

