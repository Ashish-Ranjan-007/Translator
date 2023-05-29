import express from "express";
import cors from "cors";



// import translate from "translate";
// translate.engine = "deepcl"; // "google", "yandex", "libre", "deepl"
// translate.key = process.env.deepcl;
import translate from 'google-translate-api-x';
// import translate from 'google-translate-api-x';
// // Or deconstruct all the exposed variables as
// import { translate, Translator, speak, singleTranslate, getBatchInitData, batchTranslate, languages, isSupported, getCode } from 'google-translate-api-x';
// // or again
// const { translate, Translator, speak, singleTranslate, getBatchInitData, batchTranslate, languages, isSupported, getCode } = require('google-translate-api-x');


import { speak } from 'google-translate-api-x';
import { writeFileSync } from 'fs';




const app = express();
app.use(express.json());
app.use(cors());


const bolo = " 1 Read your assignment carefully The style, structure, and focus of your essay willvary depending on the type of essay you are writing If you've been assigned to write an essay for a class Helloo hell";

console.log(bolo.length);


app.set('view engine', 'ejs');

app.get('/', async (req,res)=>{
    
const voice = await speak(bolo , {to: 'hi'}); // => Base64 encoded mp3
writeFileSync('./tempStore/bolo.mp3', voice, {encoding:'base64'});
console.log(bolo.length);
res.render('app',{});

})


app.post('/upload', async (req,res)=>{
  
 
    // Or of course
  
    const phrase = "Hola como estás ??"
    const response = await translate( phrase, {to: 'en'});
    
    console.log(response.text); //=> I speak English
    console.log(response.from.language.iso);  //=> nl

    
 
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
    

    return res.status(200).render('app', { });
    
 })











app.listen(3001, ()=>{console.log("server started at 3001")})