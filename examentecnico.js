
const fs = require('fs');

/**Funcion que filtra de todas las propuestas a partir de un criterio
    *@param {prereparto} prereparto -Este parametro es el prereparto a filtrar
    *@return {prereparto}  -Devuelve los datos filtrados de prereparto que cumplan con:
    grupoLocalizacionDesc :"CICLO 2 GRUPO A2"
    grupoLocalizacionDesc :"CICLO 1 GRUPO B"
    grupoLocalizacionDesc :"CICLO 1 GRUPO A2"
    esEcomerce :1
    */
function filtrarPropuestas(prereparto) {   
    let prereparto_filter = prereparto.filter(item => 
        item.esEcommerce == 1 &&(item.grupoLocalizacionDesc.includes("CICLO 2 GRUPO A2") || 
        item.grupoLocalizacionDesc.includes("CICLO 1 GRUPO B") || 
        item.grupoLocalizacionDesc.includes("CICLO 1 GRUPO A2"))
          )
    return prereparto_filter
        
    }
  

/** Funcion para leer datos del archivo json proporcionado.
 * @param {string} nombreArchivo - nombre del archivo a procesar
 * @returns {object} 
 */
function leerDatosDesdeArchivo(nombreArchivo) {
    try {
        const datos = fs.readFileSync(nombreArchivo, 'utf8');
        return JSON.parse(datos);
    } catch (error) {
        console.error(`Error al leer el archivo ${nombreArchivo}: ${error}`);
        return null;
    }
}



/**Manipular datos de StockUnificado para solo devolver los atributos necesarios:key,propuesta,tienda id,grupolocalizacdesc,ecomerce
 * 
 * @param {string} Prereparto_archivo
 * @returns {[{key: item.key,tiendaId:item.tiendaId,propuesta : item.propuesta,grupoLocalizacionDesc: item.grupoLocalizacionDesc,esEcommerce : item.esEcommerce}]}  
 */
function GetRepartoDataResume(Prereparto_archivo){
let Reparto_Data = []
    const prerepartoDatos = leerDatosDesdeArchivo(Prereparto_archivo);
    prerepartoDatos.data.forEach(item => {
        let  NuevoReparto = {key: item.key,
            tiendaId:item.tiendaId,propuesta : item.propuesta,
            grupoLocalizacionDesc: item.grupoLocalizacionDesc,
            esEcommerce : item.esEcommerce}
        Reparto_Data.push(NuevoReparto)})
    return(Reparto_Data)
      }


/**Manipular datos de stock para solo devolver los atributos necesarios:key,tipoStockDesc,stockEm05,stockEm01,posicioncompleta
 * 
 * @param {string} RepartoUnificado 
 * @returns {[{key: item.key,tipoStockDesc:item.tipoStockDesc,stockEm05: item.stockEm05,stockEm01 :item.stockEm01,posicioncompleta :item.posicioncompleta}]}  
 */
function GetStockDataResume(stock_UnificadoArchivo){
        let StockData = []
        const StockUnificadoDatos = leerDatosDesdeArchivo(stock_UnificadoArchivo);
        StockUnificadoDatos.data.forEach(item => {
                let NuevoAlmacen = {
                    key: item.key,
                    tipoStockDesc:item.tipoStockDesc,
                    stockEm05: item.stockEm05,
                    stockEm01 :item.stockEm01,
                    posicioncompleta :item.posicioncompleta
                    }
                StockData.push(NuevoAlmacen)})
            return(StockData)
              }  

/**Funcion que devuelve la posicion de un stock en específico del stock_Unificado
 * 
 * @param {stock} itemStock 
 * @param {StockUnificado} stockUnificado 
 * @returns {number}
 */
function GetOriginalIndex(itemStock,stockUnificado){
    let originalIndex = stockUnificado.findIndex(item => item =itemStock)
    return originalIndex
}



/**Funcion para actualizar el stock en posicion especifica con los cambios realizados en las cantidades
 * @param {objet} ItemUpdated -Elemento que contiene datos actualizados
 * @param {object} StockUnificado -Stock total unificado
 */
function UpdateStockUnificadoData(indexToUpdate,ItemUpdated,StockUnificado){
    StockUnificado[indexToUpdate] = ItemUpdated //remplazo el stock por el stock ya actualizado
return
}
 
/**Funcion par a partir de un stock espacifico, un propuesta de articulos nueva o incompleta, satisfacer la misma y actualizar el stock
               * 
               * @param {object} itemStock -Stock para cumplir el pedido
               * @param {object} propuesta -Cantidad de elementos a pedir
               * @param {number} esEcommerce 0 es tienda fisica  1 es tienda online
               * @returns 
               */
function UpdateStockEm(itemStock,propuesta,esEcommerce){
    let EstadoStock = 0     // 1 se uso el stockEm01 y 5 stockEm05
    cedido = 0             //cantidad de elementos ya cubiertos de la demanda

switch (esEcommerce){
case 1:  //Situacion para tienda online
if (itemStock.stockEm05 === 0){ //no hay disponibilidad de EM05
}
else if ( itemStock.stockEm05 - propuesta >= 0){ 
        // se cubre el pedido con la disponibilidad em05 
        itemStock.stockEm05 = itemStock.stockEm05 - propuesta- cedido 
        cedido = propuesta
        EstadoStock = 5
        break // sale del case porque ya se cumplio la propuesta
    }
    else{//hay disponibilidad pero no cubre la demanda
        cedido = itemStock.stockEm05
        itemStock.stockEm05 = 0
        EstadoStock = 5
         break
        

        }
default:  
    if (propuesta > cedido && itemStock.stockEm01 > 0 ){ 
        // no se ha satisfacido toda la propuesta o la tienda es fisica y el stock de EM01 no está vacio si es tienda fisica entra aqui directamente pq el case 1 no incluye este caso
        if (itemStock.stockEm01 - (propuesta - cedido) >= 0){
            //El stock de tienda fisica cubre la demanda
            itemStock.stockEm01 -= propuesta
            cedido = propuesta
            EstadoStock = 1
            break
           
        }
        else { cedido = itemStock.stockEm01
            //En este caso el EM01 > 0 pero no cubre completamente la demands, se utilizan los que hay y se actualiza el stock
            itemStock.stockEm01 = 0
            EstadoStock = 1
            break
        }
    }}
   
        return [cedido,itemStock,EstadoStock]
   

     }



/**
 * Funcion con lógica para procesar una propuesta de reparto a partir de los stocks disponibles
 * @param {*} propuesta -Contiene los datos de la propuesta de reparto
 * @param {*} cedido -Cantidad de elementos ya repartidos de la propuesta 
 * @param {*} stockUnificado -Stock total disponible
 * @param {*} stockAvaible  -stock dispobible de un tipo: ZAR||MSR||SILO
 * @returns [{cedido,EstadoStock,Stock },number] -Listado que contiene toda la informacion referenete al stocks usados para satisfacer la demanda, 
 * el tipo de stock (EM01 EM05) Y la cantidad usada del stock y la cantidad de artículos ya repartidos.
 */
function ProcessRequest(propuesta,cedido,stockUnificado,stockAvaible){
    Data = {}
    cedido_Total = 0
    for (i = 0; i < stockAvaible.length && cedido < propuesta.propuesta; i++)  {
        propuestaToProcess = propuesta.propuesta                   //cantidad de elementos a repartir
        esEcommerce = propuesta.esEcommerce                        //Indica si es tienda online o física
        const itemStock = stockAvaible[i]                          //accedo al stock para leer sus atributos
        indexToUpdate = GetOriginalIndex(itemStock,stockUnificado) //Localizo el stock en el stock unificado para actualizar sus datos luego
        if (itemStock.stockTotal !== 0 ){ 
            //si el stock no esta vacio
        [cedido,itemUtilizado,EstadoStock] = UpdateStockEm(itemStock,propuestaToProcess,esEcommerce)
        if (cedido >0){
            propuestaToProcess = propuestaToProcess - cedido
            cedido_Total += cedido //acumula la cantidad de artículos repartidos de la oferta
            itemUtilizado.stockTotal = itemUtilizado.stockEm05 + itemUtilizado.stockEm01
            Data = {'cedido':cedido,'EstadoStock':EstadoStock,'stock':itemUtilizado}
            UpdateStockUnificadoData(indexToUpdate,itemUtilizado,stockUnificado)}
        }}

    return [Data,cedido_Total]
}
    

/**
 * Función con la lógica para repartir una propuesta con los datos de la misma y del stock disponible
 * @param {*} propuesta   //Contiene la propuesta de reparto
 * @param {*} Stock       //StockUnificado para completar la propuesta
 * @returns {key : propuesta.key, id_Tienda : propuesta.tiendaId,propuesta :elementos a repartir,EstadoStock = 1 || 5,tipoStockDesc : 'MSR'||'ZAR'||'SILO', posicion :,comentario : 'Artículo Agotado',total : propuesta.propuesta}    }
 */
function NewPetitionToStock(propuesta,Stock){
    DataMain = [] 
    let Response = []
    const pedido = propuesta.propuesta        //cantidad de unidades a solicitar del almacen
    let cedido = 0                            //cantidad de unidades ya ceidas a esta solicitud
    
    StockMSRAvaibleforThis = Stock.filter(item =>  item.key == propuesta.key && item.tipoStockDesc =='MSR')
    StockSILOAvaibleforThis = Stock.filter(item => item.key == propuesta.key && item.tipoStockDesc == 'SILO')
    StockZARAvaibleForThis = Stock.filter(item =>  item.key ==propuesta.ke && item.tipoStockDesc == 'ZAR' )
    
    // filtro que stock hay para procesar el pedido
    if(StockMSRAvaibleforThis.length== 0 && StockSILOAvaibleforThis.length == 0 && StockZARAvaibleForThis.length == 0 ){
        //no hay stock para la clave especificada
        Response.push({key : propuesta.key, 
            id_Tienda : propuesta.tiendaId,
            propuesta : propuesta.propuesta,
            EstadoStock   : '',
            tipoStockDesc : '',
            posicion      : '',
            comentario : 'Artículo Agotado',
            total : propuesta.propuesta
        }) 
        return Response
    }

    else{
        if (StockZARAvaibleForThis.length !=0){
            //hay stock ZAR disponible para esta propuesta de reparto
            [entregado,cedido_Total] = ProcessRequest(propuesta,cedido,Stock,StockZARAvaibleforThis)
            DataMain.push(entregado)
        
        }
    
    if(cedido<pedido && StockMSRAvaibleforThis.length !=0){
        //hay stock MSR disponible para esta propuesta de reparto
        [entregado,cedido] = ProcessRequest(propuesta,cedido,Stock,StockMSRAvaibleforThis)
        DataMain.push(entregado)}

        if(cedido<pedido && StockSILOAvaibleforThis.length != 0 ){
            //hay stock SILO disponible para esta propuesta de reparto
            [entregado,cedido] =  ProcessRequest(propuesta,cedido,Stock,StockSILOAvaibleForThis)
            DataMain.push(entregado)}
     
    if (cedido<pedido){
        //No se ha podido completar el pedido
        Response.push({key : propuesta.key, 
            id_Tienda : propuesta.tiendaId,
            propuesta : '',
            EstadoStock :'',
            tipoStockDesc : '',
            posicion : '',
            comentario : 'Stock Insuficiente',
            total : propuesta.propuesta
        }) 
        return Response
    
    } 
    
    else{
        //Se ha completado el reparto
        for (i = 0;i < DataMain.length;i++){
                stockContent = DataMain[i].stock
                tableRow = {key : propuesta.key, 
                id_Tienda : propuesta.tiendaId,
                propuesta :DataMain[i].cedido,
                EstadoStock :DataMain[i].EstadoStock,
                tipoStockDesc : stockContent.tipoStockDesc,
                posicion :stockContent.posicioncompleta,
                total:propuesta.propuesta,
                comentario:'',

            }
            Response.push(tableRow)

        }
    return Response
        
    }}} 

/**  Funcion que ejecuta la logica del ejercicio
 * 
 * @param {*} Prereparto_archivo -archivo que contiene json de los prerepartos
 * @param {*} Stock_archivo -archivo que contiene json de stock unificado
 * @returns -tabla con la informacion de reparto
 */       
function Main (Prereparto_archivo,Stock_archivo){
    data = []
    Stock = leerDatosDesdeArchivo(Stock_archivo).data
    Prereparto = leerDatosDesdeArchivo(Prereparto_archivo).data
    propuestas_filtradas = filtrarPropuestas(Prereparto)
    console.log(propuestas_filtradas)
    for(entry=0 ; entry<propuestas_filtradas.length ;entry++){
        let content = NewPetitionToStock(propuestas_filtradas[entry],Stock)
        for (k = 0; k<content.length; k++){
            data.push(content[k])
        }
        
    }
    console.table(data)
}
archivo_Prereparto = 'PreReparto_bruto.json'
archivo_Stock = 'Stock_unificado.json'
Main(archivo_Prereparto,archivo_Stock)







    







    


        
    

     