const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const imgToPDF = require("image-to-pdf");

// логирование консоли в debug.log
const util = require("util");

const token = fs.readFileSync("./token.txt", { encoding: "utf8", flag: "r" });
const serverPath = "\\server\\_Baza архив\\wb_";
const dateFolder = new Date()
    .toISOString()
    .replace(/T/, "-")
    .replace(/\..+/, "")
    .replace(/:/, "-")
    .replace(/:/, "-");
const path = "\\server\\fbs\\" + dateFolder + "\\";

const log_file = fs.createWriteStream(__dirname + "/debug/" + "debug2.log", {flags: "a",});
const log_stdout = process.stdout;

console.log = function (d) {
    log_file.write(dateFolder + ": " + util.format(d) + "\n");
    log_stdout.write(util.format(d) + "\n");
};
//---------------------------------------------

axios.defaults.baseURL = "https://suppliers-api.wildberries.ru";
axios.defaults.headers.common["Authorization"] = token;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post["accept"] = "application/json";
axios.defaults.headers.get["accept"] = "application/json";

// возвращает массив новых сборочных заданий
async function getFBSordersFromSup(supplyId) {
    try {
        const response = await axios.get(
            "/api/v3/supplies/" + supplyId + "/orders"
        );
        //  console.log(response.data.orders)
        return response.data.orders;
    } catch (error) {
        if (error.response) {
            // get response with a status code not in range 2xx
            console.log(error.response);
            console.log("ошибка в ответе - " + error.response.status);
            // console.log(error.response.headers);
        } else if (error.request) {
            // no response
            console.log("нет ответа, ошибка запроса - " + error.message);
        } else {
            console.log("что-то сломалось - ", error.message);
        }
        // console.log(error.config);
    }
}

// возвращаеn стикер сборочного задания по его id
async function getBarCode(id) {
    try {
        const response = await axios.post(
            "/api/v3/orders/stickers?type=png&width=58&height=40",
            { orders: [id] }
        );
        return response.data.stickers[0];
    } catch (error) {
        if (error.response) {
            // get response with a status code not in range 2xx
            console.log(error.response);
            console.log("ошибка в ответе - " + error.response.status);
            // console.log(error.response.headers);
        } else if (error.request) {
            // no response
            console.log("нет ответа, ошибка запроса - " + error.message);
        } else {
            console.log("что-то сломалось - ", error.message);
        }
        console.log(error);
    }
}
//QR поставки
async function getSupQR(supID) {
    try {
        const response = await axios.get("/api/v3/supplies/"+supID+"/barcode?type=png");
        return response.data.file;
    } catch (error) {
        if (error.response) {
            // get response with a status code not in range 2xx
            console.log(error.response);
            console.log("ошибка в ответе - " + error.response.status);
            // console.log(error.response.headers);
        } else if (error.request) {
            // no response
            console.log("нет ответа, ошибка запроса - " + error.message);
        } else {
            console.log("что-то сломалось - ", error.message);
        }
        console.log(error);
    }
}

// возвращает массив поставок
async function getFBSsups() {
    try {
        const response = await axios.get("/api/v3/supplies", {
            params: { limit: 1000, next: 0 },
        });
        //   console.log(response.data)
        let sups = response.data.supplies;
        let supsOnWB = {};
        for (let i = 0; i < sups.length; i++) {
            if (sups[i].done == false) {
                supsOnWB[sups[i].name] = sups[i].id;
            }
        }
        // console.log(supsOnWB)
        return supsOnWB;
    } catch (error) {
        if (error.response) {
            // get response with a status code not in range 2xx
            console.log(error.response);
            console.log("ошибка в ответе - " + error.response.status);
            // console.log(error.response.headers);
        } else if (error.request) {
            // no response
            console.log("нет ответа, ошибка запроса - " + error.message);
        } else {
            console.log("что-то сломалось - ", error.message);
        }
        console.log(error.config);
    }
}

//передача поставки в доставку
async function patchSupsOnDelivery(supsOnWB) {
    try {
        let path = "/api/v3/supplies/"+supsOnWB+"/deliver";
        const response = await axios.patch(path);
      } catch (error) {
        if (error.response) { // get response with a status code not in range 2xx
          console.log(error.response);
          console.log("ошибка в ответе - " + error.response.status);
          // console.log(error.response.headers);
        } else if (error.request) { // no response
          console.log("нет ответа, ошибка запроса - "+error.message);
        } else { 
          console.log('что-то сломалось - ', error.message);
        }
        // console.log(error.config);
      }
    }
// основное тело работа с заданиями
async function foo(xx, supsID) {
    const orders = await getFBSordersFromSup(supsID); //получили массив заказов из поставки
    const path = "\\server\\fbs\\" + dateFolder + "\\";
    fs.mkdirSync(path + xx, { recursive: true }); //создали папки

    // сохраняем стикеры
    const pagesObj = {};
    const partBA = [];
    const skus = [];
    for (let i = 0; i < orders.length; i++) {
        const sticker = await getBarCode(orders[i].id);
        partBA[i] = sticker.partB + "-" + sticker.partA;
        skus[i] = orders[i].skus[0];
        pagesObj[partBA[i]] = [Buffer.from(sticker.file, "base64"), skus[i]];
        fs.appendFileSync(path+"лист подбора.txt", xx+";"+skus[i]+";"+sticker.partB+";"+partBA[i]+"\n")
    
    }
    partBA.sort();
    const pages = [];
    for (let i = 0; i < partBA.length; i++) {
        if (xx == "pp") {
            fs.copyFileSync(
                serverPath + xx + "\\" + pagesObj[partBA[i]][1] + ".pdf",
                path +xx + "\\" + partBA[i] + "-" + pagesObj[partBA[i]][1] + ".pdf"
            );
            console.log("скопирован файл " + partBA[i] + "-" + pagesObj[partBA[i]][1] + ".pdf")
        }
        if (xx == "p2") {
            fs.copyFileSync(
                serverPath + xx + "\\" + pagesObj[partBA[i]][1] + ".tif",
                path +xx+ "\\" + partBA[i] + "-" + pagesObj[partBA[i]][1] + ".tif"
            );
            console.log("скопирован файл " + partBA[i] + "-" + pagesObj[partBA[i]][1] + ".tif")
        }
        if (xx =="ps") {
            fs.copyFileSync(
                serverPath + xx + "\\" + pagesObj[partBA[i]][1] + ".tif",
                path + xx+"\\" + pagesObj[partBA[i]][1] +"-"+ partBA[i] + ".tif"
            );
            console.log("скопирован файл " + partBA[i] + "-" + pagesObj[partBA[i]][1] + ".tif")
        }
        pages[i] = pagesObj[partBA[i]][0];
    }

    imgToPDF(pages, [600, 400]).pipe(
        fs.createWriteStream(
            path + xx + " - " +supsID + " - " + pages.length + " шт.pdf"
        )
    );
    console.log("сохранили шк заданий " + xx+"-"+supsID+ "-" + pages.length + " шт.pdf")
}

// вводная часть и основное тело работы с поставками (передача в доставку и печать QR)
async function dooo() {
    const supsOnWB = await getFBSsups();
    const pagesQR = [];
    for (let xx of Object.keys(supsOnWB)) {
      console.log("работаем над поставкой - " + xx+"-"+supsOnWB[xx])
        await foo(xx, supsOnWB[xx]);

       await patchSupsOnDelivery (supsOnWB[xx])         // закрыть поставку
       pagesQR.push(await getSupQR(supsOnWB[xx]))
    }
    //сохраняем QR поставок
    imgToPDF(pagesQR, [600, 400]).pipe(fs.createWriteStream(path + "QR поставок.pdf"));
}



dooo();
