const axios = require("axios");
const fs = require("fs");
// const FormData = require('form-data');


// логирование консоли в debug.log
const util = require('util');
const log_file = fs.createWriteStream(__dirname + '/debug/'+Date.now()+'.log', {flags : 'w'});
const log_stdout = process.stdout;

console.log = function(d) { //

  log_file.write(util.format(d) + '\n');
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
async function getFBSorders() {
  try {
    const response = await axios.get('/api/v3/orders/new');
    // console.log(response.data.orders)
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

//  let sups = getFBSsups();


async function createSup(xx) {
    try {
        const response = await axios.post('/api/v3/supplies',{"name":xx});
        console.log("создалась поставка - ",xx," - ", response.data.id)
        return response.data.id;
    
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

   
async function addOrderToSup(id,supsOnWB) {
        try {
            let path = "/api/v3/supplies/"+supsOnWB+"/orders/"+id
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

async function dooo () {
    let orders = await getFBSorders();
    if (orders.length == 0) {console.log("нет новых сборочных заданий");return;}
    //создать маасив нужных поставок
    let supsOnWB = await getFBSsups();
    let  sups = Object.keys(supsOnWB).map((key) =>key);
// console.log(sups,supsOnWB)
    for (let i = 0; i < orders.length; i++) {
        const orderID = orders[i].id;
        const orderSKU = orders[i].skus[0];
        const xx = orderSKU[0]+orderSKU[1];
        if (sups.indexOf( xx ) == -1) {
            sups.push(xx);
            supsOnWB[xx] = await createSup(xx); //создать поставку и записать в обьект данные
        }
        await addOrderToSup(orderID,supsOnWB[xx]);
        console.log("добавили сборочное задание: id - " +orderID+ " - " +orderSKU+ " - "+xx+" - " + supsOnWB[xx] )
        
    }
// console.log(supsOnWB);
}

 dooo ();
// createSup("me")
// создать 3 

