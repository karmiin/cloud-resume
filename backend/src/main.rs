use lambda_http::{run, service_fn, Body, Error, Request, Response};
use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::{Client, types::{AttributeValue, ReturnValue}};

async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    // 1. Carichiamo la configurazione AWS (prende i permessi dal Ruolo IAM che abbiamo creato con Terraform)
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = Client::new(&config);

    // 2. Chiamata a DynamoDB: "Aggiorna la riga dove id='count', sommando 1 a 'visits'"
    // Usiamo "UpdateItem" perché è atomico (non si incarta se 100 persone cliccano insieme)
    let res = client
        .update_item()
        .table_name("VisitorCount")
        .key("id", AttributeValue::S("count".to_string()))
        .update_expression("ADD visits :incr")
        .expression_attribute_values(":incr", AttributeValue::N("1".to_string()))
        .return_values(ReturnValue::UpdatedNew)
        .send()
        .await;

    // 3. Estraiamo il numero dalla risposta (gestione errori molto base)
    let visit_count = match res {
        Ok(output) => {
            let attributes = output.attributes.unwrap_or_default();
            let val = attributes.get("visits").unwrap();
            val.as_n().unwrap().to_string() // Converte il numero DynamoDB in stringa
        },
        Err(err) => {
            format!("Errore DB: {:?}", err)
        }
    };

    // 4. Creiamo un JSON da restituire al browser
    let json_response = format!("{{ \"count\": {} }}", visit_count);

    let resp = Response::builder()
        .status(200)
        .header("content-type", "application/json") // Importante per il CORS!
        .body(json_response.into())
        .map_err(Box::new)?;

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(function_handler)).await
}