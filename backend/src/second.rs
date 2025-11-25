use lambda_http::{run, Body, Error, Request, Response, service_fn};

async fn second_handler(_event: Request) -> Result<Response<Body>, Error> {
     let message = format!("{{\"message\": \"Seconda lambda\"}}");

     let resp = Response::builder()
     .status(200)
     .header("content-type", "application/json")
     .body(message.into())
     .map_err(Box::new)?;

     Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(),Error>{
     run(service_fn(second_handler)).await
}    