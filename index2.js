const axios = require("axios");
const fs = require("fs");
const path = require('path')
const FormData = require('form-data');
const imgToPDF = require('image-to-pdf')


// логирование консоли в debug.log
const util = require('util');
// new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/, '-').replace(/:/, '-')
const log_file = fs.createWriteStream(__dirname + '/debug/'+'debug2.log', {flags : 'a'});
const log_stdout = process.stdout;

console.log = function(d) { //

  log_file.write(new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/, '-').replace(/:/, '-')+": "+util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};
//---------------------------------------------


let token = fs.readFileSync("./token.txt",{ encoding: 'utf8', flag: 'r' })

axios.defaults.baseURL = "https://suppliers-api.wildberries.ru";
axios.defaults.headers.common["Authorization"] = token;
axios.defaults.headers.post["Content-Type"] = "application/json";     
axios.defaults.headers.post["accept"] = "application/json";
axios.defaults.headers.get["accept"] = "application/json";


// возвращает массив новых сборочных заданий
async function getFBSordersFromSup(supplyId) {
  try {
    const response = await axios.get('/api/v3/supplies/'+supplyId+'/orders');
//  console.log(response.data.orders)
    return response.data.orders;

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


// возвращаеn стикер сборочного задания по его id
async function getBarCode(id) {
  try {
    const response = await axios.post('/api/v3/orders/stickers?type=png&width=58&height=40', {"orders":[id]});
   return response.data.stickers[0];
  

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
    console.log(error);
  }
}


// возвращает массив поставок
async function getFBSsups() {
    try {
      const response = await axios.get('/api/v3/supplies',{params: {limit: 1000,next: 0} });
    //   console.log(response.data)
    let sups = response.data.supplies;
    let supsOnWB = {};
        for (let i = 0; i < sups.length; i++) {
            
            if (sups[i].done == false) {
                supsOnWB[sups[i].name] = sups[i].id   
            }
        }
        // console.log(supsOnWB)
      return supsOnWB;
  
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
      console.log(error.config);
    }
  }



async function dooo () {
    let supsOnWB = await getFBSsups();

    let ordersPP = await getFBSordersFromSup(supsOnWB.pp)
    // let ordersP2 = await getFBSordersFromSup(supsOnWB.p2)
    // let ordersPS = await getFBSordersFromSup(supsOnWB.ps)

    
    let dateFolder=new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/, '-').replace(/:/, '-');  //Date.now();
    let pathPP="\\server\\fbs\\"+dateFolder+"\\pp";
    let pathP2="\\server\\fbs\\"+dateFolder+"\\p2";
    let pathPS="\\server\\fbs\\"+dateFolder+"\\ps";
    fs.mkdirSync (pathPP+"\\шк",{recursive: true});
    fs.mkdirSync (pathP2+"\\шк",{recursive: true});
    fs.mkdirSync (pathPS+"\\шк",{recursive: true});

// pp-------------------------------------
  const pagesObj={}
  const partBA=[]
  let serverPath  = "\\server\\_Baza архив\\wb_pp\\"
  for (let i = 0; i < ordersPP.length; i++) {
  let sticker = await getBarCode(ordersPP[i].id)
  partBA[i]=sticker.partB+"-"+sticker.partA
  pagesObj[partBA[i]]=Buffer.from(sticker.file, 'base64');
  fs.copyFileSync(serverPath+ordersPP[i].skus[0]+".pdf",pathPP+"\\"+ partBA[i]+"-"+ordersPP[i].skus[0]+".pdf")
 }
 partBA.sort();
const pages=[];
for (let i = 0; i < partBA.length; i++) {
  pages[i] = pagesObj[partBA[i]];
}
 imgToPDF(pages, [600, 400]).pipe(fs.createWriteStream(pathPP+"\\шк\\шк-pp "+pages.length+" шт.pdf"))

  
//пройти массив значков и скопировать в папку.



// console.log(sups,supsOnWB)
    // for (let i = 0; i < orders.length; i++) {
    //     const orderID = orders[i].id;
    //     const orderSKU = orders[i].skus[0];
    //     const xx = orderSKU[0]+orderSKU[1];
    //     if (sups.indexOf( xx ) == -1) {
    //         sups.push(xx);
    //         supsOnWB[xx] = await createSup(xx); //создать поставку и записать в обьект данные
    //     }
    //     await addOrderToSup(orderID,supsOnWB[xx]);
    //     console.log("добавили сборочное задание: id - " +orderID+ " - " +orderSKU+ " - "+xx+" - " + supsOnWB[xx] )
        
    // }

}

 dooo ();


