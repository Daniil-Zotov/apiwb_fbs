const axios = require("axios");
const fs = require("fs");
const imgToPDF = require("image-to-pdf");


axios.defaults.baseURL = "https://suppliers-api.wildberries.ru";
axios.defaults.headers.common["Authorization"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6IjU0MTFjN2MxLTc0NzktNGRjZS1hZGIwLWMzZDcxN2E2MDA0MiJ9.Lex2h3Hjxzz6Hf61HB0iyhBl0xzyb9AYQILsLRqczfA";
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post["accept"] = "application/json";
axios.defaults.headers.get["accept"] = "application/json";
const dateFolder = new Date()
    .toISOString()
    .replace(/T/, "-")
    .replace(/\..+/, "")
    .replace(/:/, "-")
    .replace(/:/, "-");
const path = "\\server\\fbs\\" + dateFolder + "\\";
console.log (path)
//QR поставки
async function getSupQR(supID) {
    try {
        const response = await axios.get("/api/v3/supplies/"+supID+"/barcode?type=png");
        return "data:image/png;base64,"+response.data.file;
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

async function dooo() {
    const supsOnWB = {"ps":"WB-GI-57852118","pp":"WB-GI-57852119","p2":"WB-GI-57852120",};
    const pagesQR = [];
    for (let xx of Object.keys(supsOnWB)) {
    //   console.log("работаем над поставкой - " + xx+"-"+supsOnWB[xx])
        // await foo(xx, supsOnWB[xx]);

    //    await patchSupsOnDelivery (supsOnWB[xx]);         // закрыть поставку
    //    console.log("Передали поставку в доставку"+supsOnWB[xx]);
console.log (xx)
       pagesQR.push(await getSupQR(supsOnWB[xx]));

    }
    //сохраняем QR поставок
    imgToPDF(pagesQR, [600, 400]).pipe(fs.createWriteStream( "QR поставок.pdf"));
    // console.log("сохранили QR поставок по адресу "+path + "QR поставок.pdf");
}



dooo()