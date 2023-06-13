import { createRequire } from "module";
import { writeFileSync } from "fs";
import { Router } from "express";
import serverless from "serverless-http";



const require = createRequire(import.meta.url);
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const server = http.createServer(app);
const Tesseract = require("tesseract.js");
const pdf = require("pdf-parse");
const {
  translate,
  Translator,
  speak,
  singleTranslate,
  getBatchInitData,
  batchTranslate,
  languages,
  isSupported,
  getCode,
} = require("google-translate-api-x");
const fs = require("fs");
const https = require("https");

const router = express.Router();
const PDFDocument = require("pdfkit");
const axios = require("axios");
const { createAudioFile } = require("simple-tts-mp3");
const docxParser = require("docx-parser");
var textract = require("@nosferatu500/textract");

app.use("/app/", router);
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// ------SETTING STORAGE VARIABLE ------//
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "files"); // uploaded files are stored here
  },
  filename: (req, file, cb) => {
    console.log();
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// ------LANDING PAGE API ------//

router.set("view engine", "ejs");

router.get("/", (req, res) => {
  return res.render("app", {});
});

// ------DOWNLOAD PDF API ------//

router.get("/download_pdf", async (req, res) => {
  const filepath = "./tempStore/output.pdf";

  console.log("download pdf api called");
  return res.download(filepath);

  //    setTimeout(() => {
  //     fs.unlink("./tempStore/output.pdf", ()=>{console.log("file removed")})
  //    }, 9999);
});

// ------DOWNLOAD AUDIO API ------//

router.get("/download_mp3", async (req, res) => {
  const filepath = "./tempStore/output.mp3";
  console.log("download mp3 api called");
  // res.setHeader('Content-disposition', 'attachment; filename=output.pdf');
  res.download(filepath);
});
// ------DOWNLOAD TEXT API ------//
router.get("/download_txt", async (req, res) => {
  const filepath = "./tempStore/output.txt";

  console.log("download txt api called");
  // res.setHeader('Content-disposition', 'attachment; filename=output.pdf');
  res.download(filepath);
});

// ------UPLOAD FILE API ------//

router.post("/upload", upload.single("file"), checkfile);

//--------- FUNCTION TO TRANSLATE TEXT ---------//
async function translatemech(text, lang_opt) {
  const temptranslatedText = await batchTranslate(
    text,
    { rejectOnPartialFail: false },
    { to: lang_opt.toLowerCase() }
  );

  console.log("TRANSLATED line 97===========================");
  const translatedText = await temptranslatedText.text;
  console.log(translatedText);
  return translatedText;
}

//--------- FUNCTION TO SAVE TEXT TO PDF ---------//
async function text_to_pdf(translatedText) {
  const doc = new PDFDocument();

  doc.font("./TiroDevanagariHindi-Regular.ttf");
  doc.font("./SakalBharati.ttf");
  doc.text(translatedText, 100, 100);
  doc.pipe(fs.createWriteStream("./tempStore/output.pdf"));
  doc.end();
  // await fs.unlink(`./files/${req.file.filename}`, ()=>{console.log("file removed")})
}

//--------- FUNCTION TO CONVERT TEXT TO AUDIO ---------//
async function make_audio(translatedText, lang_opt) {
  createAudioFile(translatedText, "./tempStore/output", lang_opt.toLowerCase());
}
//--------- FUNCTION TO MAKE TEXT FILE ---------//

async function to_text(translatedText) {
  try {
    fs.writeFileSync("./tempStore/output.txt", translatedText);
  } catch (err) {
    console.error(err);
  }
}

// ------FUNCTION TO CHECK THE FILE TYPE VIA EXTENSION ------//

async function checkfile(req, res) {
  const lang_opt = req.body["inputoption"];
  console.log("value");
  console.log(lang_opt);
  const filename = req.file.originalname.split(".");
  const file_extension = filename[filename.length - 1];
  console.log(file_extension);
  var translatedText = "";
  var extractedText = "";

  if (
    file_extension == "jpeg" ||
    file_extension == "jpg" ||
    file_extension == "png" ||
    file_extension == "bmp" ||
    file_extension == "pbm" ||
    file_extension == "webp"
  ) {
    console.log(req.file, req.body);
    const sendback = await Tesseract.recognize(
      `./files/${req.file.filename}`,
      "eng"
      // { logger: m => console.log(m) }
    ).then(async ({ data: { text } }) => {
      console.log(text);
      extractedText = text;
      translatedText = await translatemech(text, lang_opt);
      console.log("inside then", translatedText);
    });
    setTimeout(async () => {
      await to_text(translatedText);
      await text_to_pdf(translatedText);
      await make_audio(translatedText, lang_opt);
    }, 1000);

    return res.render("preview", {
      extractedText: extractedText,
      translatedText: translatedText,
    });
  } else if (file_extension == "pdf") {
    let dataBuffer = fs.readFileSync(`./files/${req.file.filename}`);
    await pdf(dataBuffer).then(async function (data) {
      extractedText = data.text;
      console.log("LINE 172====================", extractedText);
      translatedText = await translatemech(extractedText, lang_opt);
      console.log("line 174====================", translatedText);
    });
    // setTimeout(async ()=>{
    //     await to_text(translatedText);
    //     await text_to_pdf(translatedText);
    //     await make_audio(translatedText,lang_opt);
    // }, 1000)
    console.log("line 179 ", extractedText);

    setTimeout(async () => {
      await to_text(translatedText);
      await text_to_pdf(translatedText);
      await make_audio(translatedText, lang_opt);
    }, 1000);
    return res.render("preview", {
      extractedText: extractedText,
      translatedText: translatedText,
    });

    // error here ext and trans text are giving blanks
  } else if (
    file_extension == "docx" ||
    file_extension == "csv" ||
    file_extension == "doc" ||
    file_extension == "html" ||
    file_extension == "odt" ||
    file_extension == "rtf" ||
    file_extension == "wps" ||
    file_extension == "xml" ||
    file_extension == "xps"
  ) {
    textract.fromFileWithPath(
      `./files/${req.file.filename}`,
      async function (error, text) {
        console.log("text from doc", text);
        extractedText = await text;
        translatedText = await translatemech("extractedText", lang_opt);
        console.log(
          "--------------line 202-------------",
          extractedText,
          "--------------------line 202---------------",
          translatedText
        );
        res.render("preview", {
          extractedText: extractedText,
          translatedText: translatedText,
        });
      }
    );
    setTimeout(async () => {
      await to_text(translatedText);
      await text_to_pdf(translatedText);
      await make_audio(translatedText, lang_opt);
    }, 1000);
  } else {
    return res
      .status(400)
      .render("preview", {
        extractedText: "File type not supported",
        translatedText: "File type not supported",
      });
  }
}
// router.listen(4000, ()=>{console.log("server running at 4000")})
export const handler = serverless(api);

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
