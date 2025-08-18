[TOC]

# 期末專案：建置一個多執行緒的網頁伺服器

這是一段漫長的旅程，但我們已經到達本書的尾聲。在本章中，我們將一起建置另一個專案，以展示我們在最後幾章中涵蓋的一些概念，並回顧一些早期的課程。

作為我們的期末專案，我們將建立一個會說「hello」的網頁伺服器，並在網頁瀏覽器中看起來像圖 21-1 所示。

以下是我們建置網頁伺服器的計畫：

1. 學習一些關於 TCP 和 HTTP 的知識。
2. 在 socket 上監聽 TCP 連線。
3. 解析少量的 HTTP 請求。
4. 建立一個適當的 HTTP 響應。
5. 使用 thread pool 提升我們伺服器的吞吐量。

![Ferris icon](https://doc.rust-lang.org/book/img/trpl21-01.png)

圖 21-1：我們的最終共享專案

在我們開始之前，我們應該提兩個細節。首先，我們將使用的方法並不是用 Rust 建置網頁伺服器的最佳方式。社群成員已經在 [crates.io](https://crates.io/) 發布了許多生產就緒的 crate，它們提供了比我們將建置的更完整的網頁伺服器和 thread pool 實作。然而，我們在本章中的目的是幫助你學習，而不是走捷徑。由於 Rust 是一種系統程式語言，我們可以選擇我們想要使用的抽象層級，並且可以比其他語言更低層次地工作。

其次，我們在這裡不會使用 async 和 await。建置一個 thread pool 本身就是一個足夠大的挑戰，更不用說還要建置一個 async runtime！然而，我們將會說明 async 和 await 如何適用於本章中我們將看到的一些相同問題。最終，正如我們在第 17 章中提到的，許多 async runtime 都會使用 thread pool 來管理它們的工作。

因此，我們將手動編寫基本的 HTTP 伺服器和 thread pool，這樣你就可以學習未來可能使用的 crate 背後的一般概念和技術。

## 建置一個單執行緒的網頁伺服器

我們將從建置一個單執行緒網頁伺服器開始。在我們開始之前，讓我們先快速概述一下建置網頁伺服器所涉及的協定。這些協定的詳細資訊超出了本書的範圍，但簡要概述將為你提供所需的資訊。

網頁伺服器涉及的兩個主要協定是 *Hypertext Transfer Protocol* (*HTTP*) 和 *Transmission Control Protocol* (*TCP*)。這兩個協定都是 *request-response* 協定，這意味著 *client* 發起請求，而 *server* 監聽請求並向 client 提供響應。這些請求和響應的內容由協定定義。

TCP 是一個較低層次的協定，描述了資訊如何從一個伺服器傳輸到另一個伺服器的細節，但沒有指定該資訊是什麼。HTTP 則在 TCP 之上建置，定義了請求和響應的內容。技術上來說，HTTP 可以與其他協定一起使用，但在絕大多數情況下，HTTP 透過 TCP 傳送其資料。我們將處理 TCP 和 HTTP 請求及響應的原始位元組。

### 監聽 TCP 連線

我們的網頁伺服器需要監聽 TCP 連線，所以這是我們將首先處理的部分。標準函式庫提供了 `std::net` 模組，讓我們可以做到這一點。讓我們先以通常的方式建立一個新專案：

```
$ cargo new hello
     Created binary (application) `hello` project
$ cd hello
```

現在，在 *src/main.rs* 中輸入清單 21-1 中的程式碼來開始。這段程式碼將在本地位址 `127.0.0.1:7878` 監聽傳入的 TCP stream。當它收到傳入的 stream 時，它將印出 `Connection established!`。

src/main.rs

```rust
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        println!("Connection established!");
    }
}
```

清單 21-1：監聽傳入的 stream 並在收到 stream 時印出訊息

使用 `TcpListener`，我們可以在位址 `127.0.0.1:7878` 監聽 TCP 連線。在位址中，冒號之前的部分是一個 IP address，代表你的電腦（這在每台電腦上都相同，不特別代表作者的電腦），`7878` 則是 port。我們選擇這個 port 有兩個原因：HTTP 通常不在此 port 上接受，所以我們的伺服器不太可能與你電腦上可能執行的任何其他網頁伺服器衝突；7878 在電話上拼寫起來是 *rust*。

在這種情況下，`bind` 函式的作用類似於 `new` 函式，它會回傳一個新的 `TcpListener` 實例。這個函式被稱為 `bind` 是因為在網路中，連接到一個 port 以進行監聽被稱為「binding to a port」。

`bind` 函式回傳 `Result<T, E>`，表示 binding 可能會失敗。例如，如果我們運行了兩個程式實例，因此有兩個程式監聽同一個 port。由於我們只是為了學習目的編寫一個基本伺服器，我們不會擔心處理這類錯誤；相反，我們使用 `unwrap` 在發生錯誤時停止程式。

`TcpListener` 上的 `incoming` 方法會回傳一個 iterator，它為我們提供一系列的 stream（更確切地說，是 `TcpStream` 類型的 stream）。一個單一的 *stream* 代表 client 和 server 之間的一個開放連線。一個 *connection* 是指完整的請求和響應過程，其中 client 連接到 server，server 產生響應，然後 server 關閉連線。因此，我們將從 `TcpStream` 讀取 client 傳送的內容，然後將我們的響應寫入 stream 以將資料傳回 client。總體而言，這個 `for` 迴圈將依次處理每個連線，並為我們產生一系列的 stream 以供處理。

目前，我們對 stream 的處理只包括呼叫 `unwrap` 以在 stream 發生任何錯誤時終止程式；如果沒有任何錯誤，程式將印出訊息。我們將在下一個清單中為成功案例添加更多功能。當 client 連接到伺服器時，我們可能會從 `incoming` 方法收到錯誤的原因是，我們實際上並不是在遍歷連線。相反，我們正在遍歷「連線嘗試」。連線可能因多種原因而失敗，其中許多與作業系統相關。例如，許多作業系統對它們可以支援的同時開放連線數量有限制；超出該數量的新的連線嘗試將產生錯誤，直到一些開放連線被關閉。

讓我們嘗試執行這段程式碼！在終端機中執行 `cargo run`，然後在網頁瀏覽器中載入 *127.0.0.1:7878*。瀏覽器應該會顯示類似「Connection reset」的錯誤訊息，因為伺服器目前沒有傳回任何資料。但當你查看終端機時，你應該會看到當瀏覽器連接到伺服器時印出的幾條訊息！

```
     Running `target/debug/hello`
Connection established!
Connection established!
Connection established!
```

有時你會看到一個瀏覽器請求印出多條訊息；原因可能是瀏覽器正在請求頁面以及其他資源，例如瀏覽器分頁中出現的 *favicon.ico* 圖示。

也可能是瀏覽器試圖多次連接伺服器，因為伺服器沒有回傳任何資料。當 `stream` 超出範圍並在迴圈結束時被 drop，連線會作為 `drop` 實作的一部分而關閉。瀏覽器有時會透過重試來處理關閉的連線，因為問題可能是暫時的。

瀏覽器有時也會在不傳送任何請求的情況下，向伺服器開啟多個連線，這樣如果它們 *確實* 稍後傳送請求，這些請求就可以更快地發生。當這種情況發生時，我們的伺服器將會看到每個連線，無論該連線是否有任何請求。例如，許多基於 Chrome 的瀏覽器版本會這樣做；你可以透過使用私人瀏覽模式或使用不同的瀏覽器來停用該最佳化。

重要的因素是我們已經成功地獲得了一個 TCP 連線的 handle！

當你完成運行特定版本的程式碼時，請記住按下 <kbd>ctrl</kbd>-<kbd>C</kbd> 來停止程式。然後，在每次更改程式碼後，透過執行 `cargo run` 命令來重新啟動程式，以確保你運行的是最新程式碼。

### 讀取請求

讓我們實作從瀏覽器讀取請求的功能！為了將首先取得連線與然後對連線採取一些動作的關注點分開，我們將為處理連線啟動一個新函式。在這個新的 `handle_connection` 函式中，我們將從 TCP stream 讀取資料並印出它，這樣我們就可以看到從瀏覽器傳送的資料。將程式碼更改為清單 21-2 所示。

src/main.rs

```rust
use std::{
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    println!("Request: {http_request:#?}");
}
```

清單 21-2：從 `TcpStream` 讀取並印出資料

我們將 `std::io::prelude` 和 `std::io::BufReader` 引入作用域，以取得讓我們能夠讀寫 stream 的 trait 和類型。在 `main` 函式中的 `for` 迴圈中，我們現在不再印出表示我們建立了連線的訊息，而是呼叫新的 `handle_connection` 函式並將 `stream` 傳遞給它。

在 `handle_connection` 函式中，我們建立了一個新的 `BufReader` 實例，它包裝了對 `stream` 的參考。`BufReader` 透過為我們管理對 `std::io::Read` trait 方法的呼叫來增加緩衝。

我們建立了一個名為 `http_request` 的變數，用於收集瀏覽器傳送到我們伺服器的請求行。我們透過新增 `Vec<_>` 類型註解來表示我們希望將這些行收集到一個 vector 中。

`BufReader` 實作了 `std::io::BufRead` trait，它提供了 `lines` 方法。`lines` 方法在每次看到換行位元組時，透過分割資料 stream 來回傳 `Result<String, std::io::Error>` 的 iterator。為了取得每個 `String`，我們對每個 `Result` 進行 `map` 並 `unwrap`。如果資料不是有效的 UTF-8 或從 stream 讀取時發生問題，`Result` 可能會是錯誤。同樣地，一個生產程式應該更優雅地處理這些錯誤，但為了簡潔起見，我們選擇在錯誤情況下停止程式。

瀏覽器透過連續傳送兩個換行字元來表示 HTTP 請求的結束，因此要從 stream 取得一個請求，我們將逐行讀取，直到我們得到一個空字串為止。一旦我們將這些行收集到 vector 中，我們將使用漂亮的 debug 格式將它們印出，這樣我們就可以查看網頁瀏覽器傳送到我們伺服器的指令。

讓我們試試這段程式碼！再次啟動程式並在網頁瀏覽器中發出請求。請注意，我們仍然會在瀏覽器中收到錯誤頁面，但我們的程式在終端機中的輸出現在將類似於這樣：

```
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished dev [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/hello`
Request: [
    "GET / HTTP/1.1",
    "Host: 127.0.0.1:7878",
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language: en-US,en;q=0.5",
    "Accept-Encoding: gzip, deflate, br",
    "DNT: 1",
    "Connection: keep-alive",
    "Upgrade-Insecure-Requests: 1",
    "Sec-Fetch-Dest: document",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-Site: none",
    "Sec-Fetch-User: ?1",
    "Cache-Control: max-age=0",
]
```

根據你的瀏覽器，你可能會得到略微不同的輸出。現在我們正在印出請求資料，我們可以透過查看請求第一行 `GET` 後面的路徑來了解為什麼一個瀏覽器請求會產生多個連線。如果重複的連線都請求 `*/`，我們就知道瀏覽器正在嘗試重複擷取 `*/`，因為它沒有從我們的程式得到回應。

讓我們分解這些請求資料，以了解瀏覽器向我們的程式請求了什麼。

### 進一步了解 HTTP 請求

HTTP 是一種基於文字的協定，請求的格式如下：

```
Method Request-URI HTTP-Version CRLF
headers CRLF
message-body
```

第一行是 *request line*，它包含 client 請求的資訊。請求行的第一部分指示所使用的 *method*，例如 `GET` 或 `POST`，描述了 client 發出此請求的方式。我們的 client 使用 `GET` 請求，這表示它正在請求資訊。

請求行的下一部分是 `*/`，它指示 client 正在請求的 *uniform resource identifier* (*URI*)：URI 幾乎但又不完全與 *uniform resource locator* (*URL*) 相同。URI 和 URL 之間的差異對於我們在本章的目的並不重要，但 HTTP spec 使用 *URI* 這個術語，所以我們可以在此處將 *URI* 腦中替換為 *URL*。

最後一部分是 client 使用的 HTTP 版本，然後請求行以 CRLF 序列結束。（CRLF 代表 *carriage return* 和 *line feed*，這些是打字機時代的術語！）CRLF 序列也可以寫成 `\r\n`，其中 `\r` 是 carriage return，`\n` 是 line feed。*CRLF 序列* 將請求行與其餘請求資料分開。請注意，當 CRLF 被印出時，我們看到的是新行開始而不是 `\r\n`。

檢視我們到目前為止執行程式所收到的請求行資料，我們可以看到 `GET` 是 method，`*/` 是 request URI，而 `HTTP/1.1` 是版本。

在請求行之後，從 `Host:` 開始的其餘行都是 headers。`GET` 請求沒有 body。

嘗試從不同的瀏覽器發出請求，或請求不同的位址，例如 *127.0.0.1:7878/test*，以查看請求資料如何變化。

現在我們知道了瀏覽器請求了什麼，讓我們傳回一些資料！

### 寫入響應

我們將實作傳送資料以回應 client 請求的功能。響應的格式如下：

```
HTTP-Version Status-Code Reason-Phrase CRLF
headers CRLF
message-body
```

第一行是 *status line*，它包含響應中使用的 HTTP 版本、一個總結請求結果的數字 status code，以及提供 status code 文字描述的 reason phrase。在 CRLF 序列之後是任何 headers、另一個 CRLF 序列，以及響應的 body。

以下是一個使用 HTTP 1.1 版、status code 為 200、reason phrase 為 OK、沒有 headers 且沒有 body 的響應範例：

```
HTTP/1.1 200 OK\r\n\r\n
```

status code 200 是標準的成功響應。這段文字是一個微小的成功 HTTP 響應。讓我們將其寫入 stream 作為我們對成功請求的響應！從 `handle_connection` 函式中，刪除印出請求資料的 `println!`，並將其替換為清單 21-3 中的程式碼。

src/main.rs

```rust
fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let response = "HTTP/1.1 200 OK\r\n\r\n";

    stream.write_all(response.as_bytes()).unwrap();
}
```

清單 21-3：將一個微小的成功 HTTP 響應寫入 stream

第一行新程式碼定義了 `response` 變數，它儲存了成功訊息的資料。然後我們在 `response` 上呼叫 `as_bytes` 將字串資料轉換為位元組。`stream` 上的 `write_all` 方法接受一個 `&[u8]` 並將這些位元組直接傳送給連線。由於 `write_all` 操作可能會失敗，我們像以前一樣對任何錯誤結果使用 `unwrap`。同樣地，在實際應用程式中，你將在此處添加錯誤處理。

有了這些更改，讓我們執行程式碼並發出請求。我們不再向終端機印出任何資料，因此除了 Cargo 的輸出之外，我們不會看到任何輸出。當你在網頁瀏覽器中載入 *127.0.0.1:7878* 時，你應該會得到一個空白頁面而不是錯誤。你剛剛手動編碼了接收 HTTP 請求和傳送響應！

### 回傳真實的 HTML

讓我們實作回傳的不僅僅是空白頁面的功能。在你的專案根目錄中，而不是在 *src* 目錄中，建立一個新檔案 *hello.html*。你可以輸入任何你想要的 HTML；清單 21-4 顯示了一種可能性。

hello.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p>Hi from Rust</p>
  </body>
</html>
```

清單 21-4：一個在響應中回傳的範例 HTML 檔案

這是一個最小化的 HTML5 文件，包含一個標題和一些文字。為了在收到請求時從伺服器回傳此文件，我們將修改 `handle_connection`，如清單 21-5 所示，以讀取 HTML 文件，將其作為 body 添加到響應中，並傳送它。

src/main.rs

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};
// --snip--

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let status_line = "HTTP/1.1 200 OK";
    let contents = fs::read_to_string("hello.html").unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

清單 21-5：將 *hello.html* 的內容作為響應的 body 傳送

我們在 `use` 語句中添加了 `fs`，以便將標準函式庫的 filesystem 模組引入作用域。將檔案內容讀取為字串的程式碼應該很熟悉；我們在清單 12-4 中為 I/O 專案讀取檔案內容時使用過它。

接下來，我們使用 `format!` 將檔案內容作為成功響應的 body 添加。為了確保有效的 HTTP 響應，我們添加了 `Content-Length` header，其值設定為我們響應 body 的大小，在本例中是 `hello.html` 的大小。

使用 `cargo run` 執行此程式碼，並在瀏覽器中載入 *127.0.0.1:7878*；你應該會看到你的 HTML 被渲染出來！

目前，我們忽略了 `http_request` 中的請求資料，只是無條件地傳回 HTML 檔案的內容。這意味著如果你嘗試在瀏覽器中請求 *127.0.0.1:7878/something-else*，你仍然會收到相同的 HTML 響應。目前，我們的伺服器非常有限，並且沒有像大多數網頁伺服器那樣運作。我們希望根據請求自訂我們的響應，並且只針對格式正確的 `*/` 請求傳回 HTML 檔案。

### 驗證請求並選擇性響應

目前，我們的網頁伺服器無論 client 請求什麼，都會回傳檔案中的 HTML。讓我們增加功能，檢查瀏覽器是否正在請求 `*/`，然後再回傳 HTML 檔案，如果瀏覽器請求其他任何內容，則回傳錯誤。為此，我們需要修改 `handle_connection`，如清單 21-6 所示。這段新程式碼會檢查收到的請求內容是否與我們知道的 `*/` 請求內容一致，並添加 `if` 和 `else` 區塊以區分處理不同的請求。

src/main.rs

```rust
// --snip--

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    if request_line == "GET / HTTP/1.1" {
        let status_line = "HTTP/1.1 200 OK";
        let contents = fs::read_to_string("hello.html").unwrap();
        let length = contents.len();

        let response = format!(
            "{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}"
        );

        stream.write_all(response.as_bytes()).unwrap();
    } else {
        // some other request
    }
}
```

清單 21-6：將 `*/` 的請求與其他請求區分處理

我們只會查看 HTTP 請求的第一行，因此我們不將整個請求讀取到 vector 中，而是呼叫 `next` 以從 iterator 中取得第一個項目。第一個 `unwrap` 處理 `Option` 並在 iterator 沒有項目時停止程式。第二個 `unwrap` 處理 `Result`，其效果與清單 21-2 中添加到 `map` 的 `unwrap` 相同。

接下來，我們檢查 `request_line`，看它是否等於對 `*/` 路徑的 `GET` 請求行。如果是，`if` 區塊將回傳我們的 HTML 檔案內容。

如果 `request_line` *不* 等於對 `*/` 路徑的 `GET` 請求，這表示我們收到了其他請求。我們將在稍後向 `else` 區塊添加程式碼以回應所有其他請求。

現在執行此程式碼並請求 *127.0.0.1:7878*；你應該會得到 *hello.html* 中的 HTML。如果你發出任何其他請求，例如 *127.0.0.1:7878/something-else*，你將會收到類似於你在執行清單 21-1 和清單 21-2 中的程式碼時看到的連線錯誤。

現在讓我們將清單 21-7 中的程式碼添加到 `else` 區塊，以回傳 status code 404 的響應，這表示找不到請求的內容。我們還將回傳一些 HTML 頁面，以便在瀏覽器中顯示給終端使用者。

src/main.rs

```rust
    // --snip--
    } else {
        let status_line = "HTTP/1.1 404 NOT FOUND";
        let contents = fs::read_to_string("404.html").unwrap();
        let length = contents.len();

        let response = format!(
            "{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}"
        );

        stream.write_all(response.as_bytes()).unwrap();
    }
```

清單 21-7：如果請求的不是 `*/`，則以 status code 404 和錯誤頁面響應

在這裡，我們的響應有一個 status line，其 status code 為 404，reason phrase 為 `NOT FOUND`。響應的 body 將是檔案 *404.html* 中的 HTML。你需要在 *hello.html* 旁邊建立一個 *404.html* 檔案作為錯誤頁面；同樣地，你可以使用任何你想要的 HTML，或者使用清單 21-8 中的範例 HTML。

404.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Oops!</h1>
    <p>Sorry, I don't know what you're asking for.</p>
  </body>
</html>
```

清單 21-8：隨 404 響應傳回的頁面內容範例

有了這些更改，再次執行你的伺服器。請求 *127.0.0.1:7878* 應該會回傳 *hello.html* 的內容，而任何其他請求，例如 *127.0.0.1:7878/foo*，都應該回傳 *404.html* 的錯誤 HTML。

### 稍作重構

目前，`if` 和 `else` 區塊有很多重複：它們都讀取檔案並將檔案內容寫入 stream。唯一的區別是 status line 和檔案名稱。讓我們透過將這些差異提取到單獨的 `if` 和 `else` 行中，這些行將把 status line 和檔案名稱的值賦給變數；然後我們可以在程式碼中無條件地使用這些變數來讀取檔案和寫入響應，從而使程式碼更簡潔。清單 21-9 顯示了替換大型 `if` 和 `else` 區塊後的結果程式碼。

src/main.rs

```rust
// --snip--

fn handle_connection(mut stream: TcpStream) {
    // --snip--

    let (status_line, filename) = if request_line == "GET / HTTP/1.1" {
        ("HTTP/1.1 200 OK", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND", "404.html")
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

清單 21-9：重構 `if` 和 `else` 區塊，使其僅包含兩種情況之間不同的程式碼

現在，`if` 和 `else` 區塊只回傳 status line 和檔案名稱的適當值作為 tuple；然後我們使用解構賦值將這兩個值賦給 `status_line` 和 `filename`，這是在第 19 章中討論的 `let` 語句中的 pattern。

之前重複的程式碼現在位於 `if` 和 `else` 區塊之外，並使用 `status_line` 和 `filename` 變數。這使得更容易看出兩種情況之間的差異，而且如果我們想改變檔案讀取和響應寫入的方式，我們只需在一個地方更新程式碼。清單 21-9 中的程式碼行為將與清單 21-7 中的相同。

太棒了！我們現在有了一個大約 40 行 Rust 程式碼的簡單網頁伺服器，它對一個請求回傳一個內容頁面，並對所有其他請求回傳 404 響應。

目前，我們的伺服器運行在單個執行緒中，這意味著它一次只能處理一個請求。讓我們透過模擬一些慢速請求來檢查這如何成為一個問題。然後我們將修復它，使我們的伺服器可以同時處理多個請求。

## 將我們的單執行緒伺服器轉變為多執行緒伺服器

目前，伺服器將依次處理每個請求，這意味著它在第一個連線處理完成之前，不會處理第二個連線。如果伺服器收到越來越多的請求，這種序列執行將變得越來越不理想。如果伺服器收到一個需要很長時間處理的請求，隨後的請求將不得不等待直到長時間請求完成，即使新的請求可以快速處理。我們需要解決這個問題，但首先我們將實際觀察問題。

<a id="simulating-a-slow-request-in-the-current-server-implementation"></a>

### 模擬慢速請求

我們將看看慢速處理請求如何影響對我們目前伺服器實作所做的其他請求。清單 21-10 實作了處理對 `*/sleep` 的請求，該請求具有模擬的慢速響應，會導致伺服器在響應前睡眠五秒鐘。

src/main.rs

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};
// --snip--

fn handle_connection(mut stream: TcpStream) {
    // --snip--

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    // --snip--
}
```

清單 21-10：透過睡眠五秒來模擬慢速請求

現在我們有三種情況，所以我們從 `if` 切換到 `match`。我們需要明確地對 `request_line` 的 slice 進行 `match`，以便與字串 literal 值進行 pattern-match；`match` 不像 equality 方法那樣自動引用和解引用。

第一個 arm 與清單 21-9 中的 `if` 區塊相同。第二個 arm 匹配對 `*/sleep` 的請求。當收到該請求時，伺服器將睡眠五秒鐘，然後再呈現成功的 HTML 頁面。第三個 arm 與清單 21-9 中的 `else` 區塊相同。

你可以看到我們的伺服器是多麼原始：真正的函式庫會以一種更簡潔的方式處理多個請求的識別！

使用 `cargo run` 啟動伺服器。然後開啟兩個瀏覽器視窗：一個用於 *http://127.0.0.1:7878*，另一個用於 *http://127.0.0.1:7878/sleep*。如果你像以前一樣輸入 `*/` URI 幾次，你會看到它快速響應。但是如果你輸入 `*/sleep`，然後載入 `*/`，你會看到 `*/` 會等待 `sleep` 完成整整五秒鐘才會載入。

我們可以採用多種技術來避免請求因慢速請求而積壓，包括像我們在第 17 章中那樣使用 async；我們將實作的技術是 thread pool。

### 使用 Thread Pool 提升吞吐量

一個 *thread pool* 是一組已產生且準備好處理任務的執行緒。當程式收到一個新任務時，它會將 thread pool 中的一個執行緒指派給該任務，然後該執行緒將處理該任務。thread pool 中其餘的執行緒在第一個執行緒處理時可用於處理任何其他進來的任務。當第一個執行緒完成處理其任務時，它會回到空閒執行緒池中，準備好處理新任務。thread pool 允許你同時處理連線，從而提高伺服器的吞吐量。

我們將把 thread pool 中的執行緒數量限制在一個較小的數字，以保護我們免受 DoS 攻擊；如果我們的程式為每個傳入的請求建立一個新執行緒，那麼有人向我們的伺服器發出 1000 萬個請求可能會造成混亂，耗盡我們伺服器的所有資源並使請求處理停滯。

因此，我們不會產生無限數量的執行緒，而是在 thread pool 中預先設定固定數量的執行緒等待。傳入的請求會被傳送到 thread pool 進行處理。thread pool 將維護一個傳入請求的 queue。thread pool 中的每個執行緒都會從這個 queue 中取走一個請求，處理該請求，然後向 queue 請求另一個請求。透過這種設計，我們可以同時處理最多 *`N`* 個請求，其中 *`N`* 是執行緒的數量。如果每個執行緒都在響應一個長時間運行的請求，隨後的請求仍然可能會在 queue 中積壓，但我們已經增加了在達到該點之前可以處理的長時間運行請求的數量。

這種技術只是提高網頁伺服器吞吐量的眾多方法之一。你可能還會探索的其他選項包括 fork/join 模型、單執行緒 async I/O 模型和多執行緒 async I/O 模型。如果你對這個主題感興趣，你可以閱讀更多關於其他解決方案的資訊並嘗試實作它們；使用像 Rust 這樣的低階語言，所有這些選項都是可能的。

在我們開始實作 thread pool 之前，讓我們先談談使用這個 thread pool 應該是什麼樣子。當你試圖設計程式碼時，先編寫 client 介面可以幫助指導你的設計。先編寫程式碼的 API，使其結構符合你想要呼叫它的方式；然後在該結構中實作功能，而不是先實作功能，然後再設計公共 API。

類似於我們在第 12 章的專案中使用的 test-driven development，我們將在這裡使用 compiler-driven development。我們將編寫呼叫我們想要的功能的程式碼，然後我們將查看來自編譯器的錯誤，以確定我們下一步應該更改什麼以使程式碼正常工作。然而，在此之前，我們將探討我們不打算使用的技術作為起點。

<a id="code-structure-if-we-could-spawn-a-thread-for-each-request"></a>

#### 為每個請求產生一個執行緒的程式碼結構

首先，讓我們探討一下如果程式碼為每個連線建立一個新執行緒，它可能會是什麼樣子。如前所述，由於可能產生無限數量的執行緒的問題，這不是我們的最終計畫，但它是先獲得一個正常運作的多執行緒伺服器的起點。然後我們將把 thread pool 作為一個改進來添加，對比兩種解決方案會更容易。

清單 21-11 顯示了對 `main` 進行的更改，以便在 `for` 迴圈內產生一個新執行緒來處理每個 stream。

src/main.rs

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        thread::spawn(|| {
            handle_connection(stream);
        });
    }
}
```

清單 21-11：為每個 stream 產生一個新執行緒

正如你在第 16 章中學到的，`thread::spawn` 將建立一個新執行緒，然後在新執行緒中執行 closure 中的程式碼。如果你執行這段程式碼並在瀏覽器中載入 `*/sleep`，然後在另外兩個瀏覽器分頁中載入 `*/`，你會確實看到對 `*/` 的請求不必等待 `*/sleep` 完成。然而，正如我們所說，這最終會使系統不堪重負，因為你將毫無限制地建立新執行緒。

你可能還記得第 17 章，這種情況正是 async 和 await 真正大放異彩的地方！當我們建置 thread pool 時，請記住這一點，並思考 async 在這種情況下會呈現出什麼不同的或相同的樣貌。

<a id="creating-a-similar-interface-for-a-finite-number-of-threads"></a>

#### 建立有限數量的執行緒

我們希望我們的 thread pool 以類似、熟悉的方式運作，以便從執行緒切換到 thread pool 不需要對使用我們 API 的程式碼進行大量更改。清單 21-12 顯示了我們想要取代 `thread::spawn` 的 `ThreadPool` 結構體的假設介面。

src/main.rs

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}
```

清單 21-12：我們理想的 `ThreadPool` 介面

我們使用 `ThreadPool::new` 建立一個新的 thread pool，其中包含可配置數量的執行緒，在這裡是四個。然後，在 `for` 迴圈中，`pool.execute` 具有與 `thread::spawn` 類似的介面，它接受一個 closure，pool 應該為每個 stream 運行該 closure。我們需要實作 `pool.execute`，使其接受 closure 並將其交給 thread pool 中的一個執行緒運行。這段程式碼尚無法編譯，但我們將嘗試編譯，以便編譯器可以指導我們如何修復它。

<a id="building-the-threadpool-struct-using-compiler-driven-development"></a>

#### 使用編譯器驅動開發建置 ThreadPool

將清單 21-12 中的更改應用到 *src/main.rs*，然後讓我們使用來自 `cargo check` 的編譯器錯誤來驅動我們的開發。這是我們得到的第一個錯誤：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0433]: failed to resolve: use of undeclared type `ThreadPool`
  --> src/main.rs:11:16
   |
11 |     let pool = ThreadPool::new(4);
   |                ^^^^^^^^^^ use of undeclared type `ThreadPool`

For more information about this error, try `rustc --explain E0433`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

太棒了！這個錯誤告訴我們需要一個 `ThreadPool` 類型或模組，所以我們現在就建置一個。我們的 `ThreadPool` 實作將獨立於我們的網頁伺服器正在做的工作類型。因此，讓我們將 `hello` crate 從 binary crate 更改為 library crate，以容納我們的 `ThreadPool` 實作。更改為 library crate 後，我們還可以使用單獨的 thread pool 函式庫來執行任何我們想使用 thread pool 完成的工作，而不僅僅是處理網頁請求。

建立一個 *src/lib.rs* 檔案，其中包含以下內容，這是我們目前可以擁有的 `ThreadPool` 結構體的最簡單定義：

src/lib.rs

```rust
pub struct ThreadPool;
```

然後編輯 *main.rs* 檔案，透過在 *src/main.rs* 的頂部添加以下程式碼，將 `ThreadPool` 從 library crate 引入作用域：

src/main.rs

```rust
use hello::ThreadPool;
```

這段程式碼仍然無法運作，但讓我們再次檢查它以取得我們需要處理的下一個錯誤：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0599]: no function or associated item named `new` found for struct `ThreadPool` in the current scope
  --> src/main.rs:12:28
   |
12 |     let pool = ThreadPool::new(4);
   |                            ^^^ function or associated item not found in `ThreadPool`

For more information about this error, try `rustc --explain E0599`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

此錯誤表示我們接下來需要為 `ThreadPool` 建立一個名為 `new` 的關聯函式。我們也知道 `new` 需要一個參數來接受 `4` 作為引數，並應回傳一個 `ThreadPool` 實例。讓我們實作最簡單的 `new` 函式，它將具有這些特性：

src/lib.rs

```rust
pub struct ThreadPool;

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        ThreadPool
    }
}
```

我們選擇 `usize` 作為 `size` 參數的類型，因為我們知道負數的執行緒數量沒有任何意義。我們也知道我們將使用這個 `4` 作為執行緒集合中的元素數量，這正是 `usize` 類型所用的，如第 3 章「整數類型」中所述。

讓我們再次檢查程式碼：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0599]: no method named `execute` found for struct `ThreadPool` in the current scope
  --> src/main.rs:17:14
   |
17 |         pool.execute(|| {
   |         -----^^^^^^^ method not found in `ThreadPool`

For more information about this error, try `rustc --explain E0599`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

現在錯誤發生是因為我們在 `ThreadPool` 上沒有 `execute` 方法。回想第 12 章的「建立有限數量的執行緒」，我們決定我們的 thread pool 應該有一個類似於 `thread::spawn` 的介面。此外，我們將實作 `execute` 函式，使其接受給定的 closure 並將其交給 thread pool 中的空閒執行緒運行。

我們將在 `ThreadPool` 上定義 `execute` 方法，使其接受一個 closure 作為參數。回想第 13 章「將擷取到的值移出 Closure 和 `Fn` Trait」中討論的，我們可以透過三個不同的 trait 來接受 closure 作為參數：`Fn`、`FnMut` 和 `FnOnce`。我們需要決定在這裡使用哪種類型的 closure。我們知道我們最終會做類似於標準函式庫 `thread::spawn` 實作的事情，所以我們可以看看 `thread::spawn` 的簽名在其參數上施加了什麼 bound。文件向我們展示了以下內容：

```
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

這裡我們關心的是 `F` 類型參數；`T` 類型參數與回傳值有關，我們不關心它。我們可以看到 `spawn` 使用 `FnOnce` 作為 `F` 上的 trait bound。這可能也是我們想要的，因為我們最終會將 `execute` 中獲得的引數傳遞給 `spawn`。我們進一步確信 `FnOnce` 是我們想要使用的 trait，因為用於執行請求的執行緒只會執行該請求的 closure 一次，這與 `FnOnce` 中的 `Once` 相符。

`F` 類型參數也具有 `Send` trait bound 和 `'static` lifetime bound，這在我們的情況下很有用：我們需要 `Send` 來將 closure 從一個執行緒傳輸到另一個執行緒，以及 `'static`，因為我們不知道執行緒需要多長時間才能執行。讓我們在 `ThreadPool` 上建立一個 `execute` 方法，它將接受一個具有這些 bound 的 `F` 類型通用參數：

src/lib.rs

```rust
impl ThreadPool {
    // --snip--
    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}
```

我們仍然在 `FnOnce` 後面使用 `()`，因為這個 `FnOnce` 代表一個不接受任何參數並回傳單元類型 `()` 的 closure。就像函式定義一樣，回傳類型可以從簽名中省略，但即使我們沒有參數，我們仍然需要括號。

同樣地，這是 `execute` 方法最簡單的實作：它什麼都不做，但我們只是試圖讓我們的程式碼編譯。讓我們再檢查一次：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.24s
```

它編譯了！但請注意，如果你嘗試 `cargo run` 並在瀏覽器中發出請求，你會看到本章開頭我們看到的瀏覽器錯誤。我們的函式庫實際上還沒有呼叫傳遞給 `execute` 的 closure！

> 注意：你可能會聽到關於具有嚴格編譯器的語言（如 Haskell 和 Rust）的一句話是「如果程式碼編譯了，它就能運作」。但這句話並非普遍適用。我們的專案編譯了，但它什麼都沒做！如果我們正在建置一個真正的完整專案，這將是開始編寫 unit test 的好時機，以檢查程式碼是否編譯 *並* 具有我們想要的行為。

思考：如果我們要執行一個 future 而不是一個 closure，這裡會有什麼不同？

#### 驗證 `new` 中的執行緒數量

我們對 `new` 和 `execute` 的參數沒有做任何事情。讓我們實作這些函式的 body，使其具有我們想要的行為。首先，讓我們思考 `new`。前面我們為 `size` 參數選擇了無符號類型，因為執行緒數量為負的 pool 沒有任何意義。然而，執行緒數量為零的 pool 也沒有任何意義，但零是一個完全有效的 `usize`。我們將添加程式碼來檢查 `size` 是否大於零，然後再回傳 `ThreadPool` 實例，並使用 `assert!` macro 在收到零時讓程式 panic，如清單 21-13 所示。

src/lib.rs

```rust
impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        ThreadPool
    }

    // --snip--
}
```

清單 21-13：實作 `ThreadPool::new`，如果 `size` 為零則 panic

我們還為 `ThreadPool` 添加了一些文件，並使用 doc comments。請注意，我們遵循了良好的文件實踐，添加了一個部分，指出了我們的函式可能 panic 的情況，如第 14 章所述。嘗試執行 `cargo doc --open` 並點擊 `ThreadPool` 結構體，看看 `new` 函式產生的文件是什麼樣子！

我們這裡不是新增 `assert!` macro，而是將 `new` 更改為 `build` 並回傳 `Result`，就像我們在清單 12-9 的 I/O 專案中對 `Config::build` 所做的那樣。但我們在這種情況下決定，嘗試建立一個沒有任何執行緒的 thread pool 應該是一個無法恢復的錯誤。如果你有野心，請嘗試編寫一個名為 `build` 的函式，其簽名如下，以便與 `new` 函式進行比較：

```
pub fn build(size: usize) -> Result<ThreadPool, PoolCreationError> {
```

#### 建立儲存執行緒的空間

現在我們知道如何知道池中儲存執行緒的有效數量了，我們可以在回傳結構體之前建立這些執行緒並將它們儲存在 `ThreadPool` 結構體中。但是我們如何「儲存」一個執行緒呢？讓我們再看看 `thread::spawn` 的簽名：

```
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

`spawn` 函式回傳 `JoinHandle<T>`，其中 `T` 是 closure 回傳的類型。讓我們也嘗試使用 `JoinHandle`，看看會發生什麼。在我們的例子中，我們傳遞給 thread pool 的 closure 將處理連線並且不回傳任何東西，所以 `T` 將是單元類型 `()`。

清單 21-14 中的程式碼會編譯，但尚未建立任何執行緒。我們修改了 `ThreadPool` 的定義，使其包含一個 `thread::JoinHandle<()>` 實例的 vector，並以 `size` 的容量初始化該 vector，設定一個 `for` 迴圈來執行一些程式碼以建立執行緒，並回傳一個包含這些執行緒的 `ThreadPool` 實例。

src/lib.rs

```rust
use std::thread;

pub struct ThreadPool {
    threads: Vec<thread::JoinHandle<()>>,
}

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut threads = Vec::with_capacity(size);

        for _ in 0..size {
            // create some threads and store them in the vector
        }

        ThreadPool { threads }
    }
    // --snip--
}
```

清單 21-14：為 `ThreadPool` 建立一個 vector 以容納執行緒

我們已將 `std::thread` 引入函式庫 crate 的作用域，因為我們使用 `thread::JoinHandle` 作為 `ThreadPool` 中 vector 項目的類型。

一旦收到有效大小，我們的 `ThreadPool` 就會建立一個可以容納 `size` 個項目的新 vector。`with_capacity` 函式執行與 `Vec::new` 相同的任務，但有一個重要區別：它會預先為 vector 分配空間。由於我們知道需要在 vector 中儲存 `size` 個元素，因此這種預先分配比使用 `Vec::new` 稍微更有效率，因為 `Vec::new` 會隨著元素插入而調整大小。

當你再次執行 `cargo check` 時，它應該會成功。

<a id ="a-worker-struct-responsible-for-sending-code-from-the-threadpool-to-a-thread"></a>

#### 從 ThreadPool 向執行緒傳送程式碼

我們在清單 21-14 中的 `for` 迴圈中留下了一個關於執行緒建立的註解。在這裡，我們將探討如何實際建立執行緒。標準函式庫提供了 `thread::spawn` 作為建立執行緒的方式，而 `thread::spawn` 期望在執行緒建立後立即執行一些程式碼。然而，在我們的案例中，我們希望建立執行緒並讓它們 *等待* 我們稍後將傳送的程式碼。標準函式庫的執行緒實作不包含任何這樣做的方法；我們必須手動實作它。

我們將透過在 `ThreadPool` 和執行緒之間引入一個新的資料結構來實作這種行為，該結構將管理這種新行為。我們將此資料結構稱為 *Worker*，這是 pooling 實作中的常見術語。`Worker` 負責接收需要執行的程式碼並在其執行緒中執行該程式碼。

想像一下餐廳廚房裡工作的人：工人等待顧客點餐，然後他們負責接單並完成訂單。

我們將不在 thread pool 中儲存 `JoinHandle<()>` 實例的 vector，而是儲存 `Worker` 結構體的實例。每個 `Worker` 將儲存一個 `JoinHandle<()>` 實例。然後我們將在 `Worker` 上實作一個方法，該方法將接受一個要執行的程式碼 closure，並將其傳送到已在運行的執行緒進行執行。我們還將給每個 `Worker` 一個 `id`，以便在記錄或 debug 時區分 pool 中不同的 `Worker` 實例。

以下是我們建立 `ThreadPool` 時將發生的新過程。我們將在以這種方式設定 `Worker` 後，實作將 closure 傳送給執行緒的程式碼：

1. 定義一個 `Worker` 結構體，它包含一個 `id` 和一個 `JoinHandle<()>`。
2. 將 `ThreadPool` 更改為包含 `Worker` 實例的 vector。
3. 定義一個 `Worker::new` 函式，它接受一個 `id` 數字並回傳一個 `Worker` 實例，該實例包含 `id` 和一個以空 closure 產生的執行緒。
4. 在 `ThreadPool::new` 中，使用 `for` 迴圈計數器產生一個 `id`，使用該 `id` 建立一個新的 `Worker`，並將該 `Worker` 儲存在 vector 中。

如果你想挑戰一下，請在查看清單 21-15 中的程式碼之前，嘗試自行實作這些更改。

準備好了嗎？這是清單 21-15，其中包含一種進行上述修改的方法。

src/lib.rs

```rust
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
}

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers }
    }
    // --snip--
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize) -> Worker {
        let thread = thread::spawn(|| {});

        Worker { id, thread }
    }
}
```

清單 21-15：修改 `ThreadPool` 以容納 `Worker` 實例，而不是直接容納執行緒

我們已將 `ThreadPool` 上的欄位名稱從 `threads` 更改為 `workers`，因為它現在持有 `Worker` 實例而不是 `JoinHandle<()>` 實例。我們將 `for` 迴圈中的計數器作為引數傳遞給 `Worker::new`，並將每個新的 `Worker` 儲存在名為 `workers` 的 vector 中。

外部程式碼（如 *src/main.rs* 中的伺服器）不需要知道 `ThreadPool` 內部使用 `Worker` 結構體的實作細節，因此我們將 `Worker` 結構體及其 `new` 函式設定為 private。`Worker::new` 函式使用我們給定的 `id` 並儲存一個透過使用空 closure 產生新執行緒而建立的 `JoinHandle<()>` 實例。

> 注意：如果作業系統因為系統資源不足而無法建立執行緒，`thread::spawn` 將會 panic。這將導致我們的整個伺服器 panic，即使某些執行緒的建立可能會成功。為了簡單起見，這種行為是可以接受的，但在生產級的 thread pool 實作中，你可能會希望使用 `std::thread::Builder` 及其 `spawn` 方法，該方法回傳 `Result`。

這段程式碼將會編譯並儲存我們在 `ThreadPool::new` 中指定為引數的 `Worker` 實例數量。但我們 *仍然* 沒有處理在 `execute` 中獲得的 closure。接下來我們來看看如何做到這一點。

#### 透過 Channel 向執行緒傳送請求

我們接下來要處理的問題是，傳遞給 `thread::spawn` 的 closure 什麼都沒做。目前，我們在 `execute` 方法中得到了我們想要執行的 closure。但是我們需要在建立 `ThreadPool` 期間建立每個 `Worker` 時，向 `thread::spawn` 提供一個要執行的 closure。

我們希望剛才建立的 `Worker` 結構體從 `ThreadPool` 中維護的 queue 獲取要執行的程式碼，並將該程式碼傳送給其執行緒以執行。

我們在第 16 章學到的 channel——一種在兩個執行緒之間進行通訊的簡單方法——將非常適合這個用例。我們將使用 channel 作為 job 的 queue，而 `execute` 將從 `ThreadPool` 向 `Worker` 實例傳送一個 job，`Worker` 實例將該 job 傳送給其執行緒。以下是計畫：

1. `ThreadPool` 將建立一個 channel 並持有 sender。
2. 每個 `Worker` 將持有 receiver。
3. 我們將建立一個新的 `Job` 結構體，它將包含我們想要透過 channel 傳送的 closure。
4. `execute` 方法將透過 sender 傳送它想要執行的 job。
5. 在其執行緒中，`Worker` 將在其 receiver 上迴圈，並執行它收到的任何 job 的 closure。

讓我們先在 `ThreadPool::new` 中建立一個 channel，並將 sender 儲存在 `ThreadPool` 實例中，如清單 21-16 所示。`Job` 結構體目前不包含任何內容，但它將是我們透過 channel 傳送的項目類型。

src/lib.rs

```rust
use std::{sync::mpsc, thread};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

struct Job;

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers, sender }
    }
    // --snip--
}
```

清單 21-16：修改 `ThreadPool` 以儲存傳輸 `Job` 實例的 channel 的 sender

在 `ThreadPool::new` 中，我們建立了一個新的 channel，並讓 thread pool 持有 sender。這將成功編譯。

讓我們嘗試將 channel 的 receiver 傳遞給每個 `Worker`，當 thread pool 建立 channel 時。我們知道我們想在 `Worker` 實例產生的執行緒中使用 receiver，所以我們將在 closure 中引用 `receiver` 參數。清單 21-17 中的程式碼還無法完全編譯。

src/lib.rs

```rust
impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, receiver));
        }

        ThreadPool { workers, sender }
    }
    // --snip--
}

// --snip--

impl Worker {
    fn new(id: usize, receiver: mpsc::Receiver<Job>) -> Worker {
        let thread = thread::spawn(|| {
            receiver;
        });

        Worker { id, thread }
    }
}
```

清單 21-17：將 receiver 傳遞給每個 `Worker`

我們進行了一些小而直接的更改：我們將 receiver 傳遞給 `Worker::new`，然後在 closure 內部使用它。

當我們嘗試檢查這段程式碼時，我們得到以下錯誤：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0382]: use of moved value: `receiver`
  --> src/lib.rs:26:42
   |
21 |         let (sender, receiver) = mpsc::channel();
   |                      -------- move occurs because `receiver` has type `std::sync::mpsc::Receiver<Job>`, which does not implement the `Copy` trait
...
25 |         for id in 0..size {
   |         ----------------- inside of this loop
26 |             workers.push(Worker::new(id, receiver));
   |                                          ^^^^^^^^ value moved here, in previous iteration of loop
   |
note: consider changing this parameter type in method `new` to borrow instead if owning the value isn't necessary
  --> src/lib.rs:47:33
   |
47 |     fn new(id: usize, receiver: mpsc::Receiver<Job>) -> Worker {
   |        --- in this method       ^^^^^^^^^^^^^^^^^^^ this parameter takes ownership of the value
help: consider moving the expression out of the loop so it is only moved once
   |
25 ~         let mut value = Worker::new(id, receiver);
26 ~         for id in 0..size {
27 ~             workers.push(value);
   |

For more information about this error, try `rustc --explain E0382`.
error: could not compile `hello` (lib) due to 1 previous error
```

程式碼試圖將 `receiver` 傳遞給多個 `Worker` 實例。這將不起作用，正如你在第 16 章中回想的那樣：Rust 提供的 channel 實作是多個 *producer*，單個 *consumer*。這意味著我們不能簡單地複製 channel 的消費端來修復這段程式碼。我們也不希望將訊息多次傳送給多個 consumer；我們希望有一個訊息列表，其中包含多個 `Worker` 實例，以便每個訊息只被處理一次。

此外，從 channel queue 中取出一個 job 涉及到變異 `receiver`，所以執行緒需要一種安全的方式來共用和修改 `receiver`；否則，我們可能會遇到 race conditions（如第 16 章所述）。

回想第 16 章討論的 thread-safe smart pointer：為了在多個執行緒之間共享 ownership 並允許執行緒變異值，我們需要使用 `Arc<Mutex<T>>`。`Arc` 類型將允許多個 `Worker` 實例擁有 receiver，而 `Mutex` 將確保每次只有一個 `Worker` 可以從 receiver 取得 job。清單 21-18 顯示了我們需要做的更改。

src/lib.rs

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};
// --snip--

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    // --snip--
}

// --snip--

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        // --snip--
    }
}
```

清單 21-18：使用 `Arc` 和 `Mutex` 在 `Worker` 實例之間共享 receiver

在 `ThreadPool::new` 中，我們將 receiver 放入 `Arc` 和 `Mutex` 中。對於每個新的 `Worker`，我們複製 `Arc` 以增加引用計數，這樣 `Worker` 實例就可以共享 receiver 的 ownership。

有了這些更改，程式碼就可以編譯了！我們正在接近成功！

#### 實作 execute 方法

讓我們最後實作 `ThreadPool` 上的 `execute` 方法。我們還會將 `Job` 從結構體更改為 trait object 的類型別名，該 trait object 包含 `execute` 接收的 closure 類型。正如第 20 章「使用類型別名建立類型同義詞」中所述，類型別名允許我們縮短冗長的類型以方便使用。請看清單 21-19。

src/lib.rs

```rust
// --snip--

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    // --snip--

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.send(job).unwrap();
    }
}

// --snip--
```

清單 21-19：為包含每個 closure 的 `Box` 建立一個 `Job` 類型別名，然後將 job 傳送給 channel

建立一個新的 `Job` 實例後，我們使用 `execute` 中獲得的 closure，然後將該 job 傳送到 channel 的傳送端。我們對 `send` 呼叫 `unwrap` 以處理傳送失敗的情況。這可能會發生，例如，如果我們停止所有執行緒執行，這意味著接收端已停止接收新訊息。目前，我們無法阻止執行緒執行：只要 thread pool 存在，我們的執行緒就會繼續執行。我們使用 `unwrap` 的原因是因為我們知道失敗情況不會發生，但編譯器不知道。

但我們還沒完全結束！在 `Worker` 中，傳遞給 `thread::spawn` 的 closure 仍然只 *引用* channel 的接收端。相反，我們需要 closure 永遠迴圈，向 channel 的接收端請求 job，並在獲得 job 時執行它。讓我們在 `Worker::new` 中進行清單 21-20 所示的更改。

src/lib.rs

```rust
// --snip--

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let job = receiver.lock().unwrap().recv().unwrap();

                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

清單 21-20：在 `Worker` 實例的執行緒中接收和執行 job

這裡，我們首先在 `receiver` 上呼叫 `lock` 來取得 mutex，然後呼叫 `unwrap` 來處理任何錯誤。取得鎖可能會失敗，如果 mutex 處於 *poisoned* 狀態，這可能會發生在其他執行緒在持有鎖時發生 panic 而不是釋放鎖的情況。在這種情況下，呼叫 `unwrap` 讓這個執行緒 panic 是正確的動作。你可以隨意將這個 `unwrap` 更改為 `expect`，並帶有對你有意義的錯誤訊息。

如果我們取得 mutex 的鎖，我們就呼叫 `recv` 從 channel 接收一個 `Job`。最後一個 `unwrap` 也忽略了這裡可能發生的任何錯誤，這可能發生在持有 sender 的執行緒已經關閉的情況下，類似於如果 receiver 關閉，`send` 方法會回傳 `Err`。

`recv` 的呼叫會阻塞，所以如果還沒有 job，當前執行緒會等到 job 可用。`Mutex<T>` 確保一次只有一個 `Worker` 執行緒嘗試請求 job。

我們的 thread pool 現在處於工作狀態！執行 `cargo run` 並發出一些請求：

```
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
warning: field `workers` is never read
 --> src/lib.rs:7:5
  |
6 | pub struct ThreadPool {
  |            ---------- field in this struct
7 |     workers: Vec<Worker>,
  |     ^^^^^^^
  |
  = note: `#[warn(dead_code)]` on by default

warning: fields `id` and `thread` are never read
  --> src/lib.rs:48:5
   |
47 | struct Worker {
   |        ------ fields in this struct
48 |     id: usize,
   |     ^^
49 |     thread: thread::JoinHandle<()>,
   |     ^^^^^^

warning: `hello` (lib) generated 2 warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.91s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
```

成功！我們現在有了一個 thread pool，它異步執行連線。建立的執行緒永遠不會超過四個，因此如果伺服器收到大量請求，我們的系統不會超載。如果我們向 `*/sleep` 發出請求，伺服器將能夠透過讓另一個執行緒運行它們來服務其他請求。

> 注意：如果你同時在多個瀏覽器視窗中開啟 `*/sleep`，它們可能會以五秒間隔一個接一個地載入。某些網頁瀏覽器會為了快取原因而依序執行相同請求的多個實例。這個限制並非由我們的網頁伺服器造成。

現在是個好時機停下來思考，如果我們使用 futures 而不是 closure 來完成工作，清單 21-18、21-19 和 21-20 中的程式碼會有哪些不同。哪些類型會改變？方法簽名會有什麼不同，如果有的話？程式碼的哪些部分會保持不變？

在學習了第 17 章和第 19 章的 `while let` 迴圈後，你可能想知道為什麼我們沒有像清單 21-21 所示的那樣編寫 `Worker` 執行緒程式碼。

src/lib.rs

```rust
// --snip--

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            while let Ok(job) = receiver.lock().unwrap().recv() {
                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

清單 21-21：使用 `while let` 的 `Worker::new` 的另一種實作方式

這段程式碼可以編譯和運行，但沒有達到預期的執行緒行為：慢速請求仍然會導致其他請求等待處理。原因有些微妙：`Mutex` 結構體沒有公開的 `unlock` 方法，因為鎖的所有權基於 `lock` 方法回傳的 `LockResult<MutexGuard<T>>` 中 `MutexGuard<T>` 的 lifetime。在編譯時，借用檢查器可以強制執行一個規則，即受 `Mutex` 保護的資源無法在我們不持有鎖的情況下訪問。然而，如果我們不注意 `MutexGuard<T>` 的 lifetime，這種實作也可能導致鎖持有時間比預期更長。

清單 21-20 中使用 `let job = receiver.lock().unwrap().recv().unwrap();` 的程式碼之所以能運作，是因為在 `let` 語句結束時，等號右側表達式中使用的任何暫存值都會立即被 drop。然而，`while let`（以及 `if let` 和 `match`）在相關區塊結束之前不會 drop 暫存值。在清單 21-21 中，鎖在呼叫 `job()` 的整個過程中一直被持有，這意味著其他 `Worker` 實例無法接收 job。

## 優雅關機與清理

清單 21-20 中的程式碼透過使用 thread pool 異步回應請求，正如我們所預期的。我們收到了一些關於 `workers`、`id` 和 `thread` 欄位的警告，這些欄位我們沒有直接使用，這提醒我們沒有清理任何東西。當我們使用較不優雅的 <kbd>ctrl</kbd>-<kbd>C</kbd> 方法來停止主執行緒時，所有其他執行緒也會立即停止，即使它們正在處理請求中。

接下來，我們將實作 `Drop` trait，以在 pool 中的每個執行緒上呼叫 `join`，以便它們在關閉之前完成正在處理的請求。然後，我們將實作一種方法來告訴執行緒它們應該停止接受新請求並關閉。為了實際看到這段程式碼，我們將修改我們的伺服器，使其只接受兩個請求，然後優雅地關閉其 thread pool。

在我們進行時，有一點值得注意：這一切都不會影響程式中處理執行 closures 的部分，因此如果我們將 thread pool 用於 async runtime，這裡的一切都將完全相同。

### 在 ThreadPool 上實作 Drop Trait

讓我們從在我們的 thread pool 上實作 `Drop` 開始。當 thread pool 被 drop 時，我們的所有執行緒都應該 join，以確保它們完成工作。清單 21-22 顯示了 `Drop` 實作的首次嘗試；這段程式碼還無法完全運作。

src/lib.rs

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

清單 21-22：當 thread pool 超出作用域時 join 每個執行緒

我們首先遍歷 thread pool 的每個 `workers`。我們使用 `&mut`，因為 `self` 是一個 mutable reference，而且我們還需要能夠變異 `worker`。對於每個 `worker`，我們印出一個訊息，表示這個特定的 `Worker` 實例正在關閉，然後我們在該 `Worker` 實例的執行緒上呼叫 `join`。如果呼叫 `join` 失敗，我們使用 `unwrap` 讓 Rust panic 並進入非優雅關機。

這是我們編譯這段程式碼時遇到的錯誤：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0507]: cannot move out of `worker.thread` which is behind a mutable reference
  --> src/lib.rs:52:13
   |
52 |             worker.thread.join().unwrap();
   |             ^^^^^^^^^^^^^ ------ `worker.thread` moved due to this method call
   |             |
   |             move occurs because `worker.thread` has type `JoinHandle<()>`, which does not implement the `Copy` trait
   |
note: `JoinHandle::<T>::join` takes ownership of the receiver `self`, which moves `worker.thread`
  --> /rustc/4eb161250e340c8f48f66e2b929ef4a5bed7c181/library/std/src/thread/mod.rs:1876:17

For more information about this error, try `rustc --explain E0507`.
error: could not compile `hello` (lib) due to 1 previous error
```

錯誤告訴我們不能呼叫 `join`，因為我們只對每個 `worker` 有一個可變借用，而 `join` 會取得其參數的 ownership。為了解決這個問題，我們需要將執行緒從擁有 `thread` 的 `Worker` 實例中移出，以便 `join` 可以消耗該執行緒。一種方法是採用我們在清單 18-15 中所做的方法。如果 `Worker` 包含一個 `Option<thread::JoinHandle<()>>`，我們就可以在 `Option` 上呼叫 `take` 方法，將值從 `Some` 變體中移出，並在原地留下一個 `None` 變體。換句話說，正在運行的 `Worker` 在 `thread` 中會有一個 `Some` 變體，當我們想要清理一個 `Worker` 時，我們會用 `None` 替換 `Some`，這樣 `Worker` 就沒有執行緒可以運行了。

然而，這只會在 drop `Worker` 時才會出現。作為交換，我們將不得不處理任何我們訪問 `worker.thread` 的地方的 `Option<thread::JoinHandle<()>>`。慣用的 Rust 確實會大量使用 `Option`，但當你發現自己為了這種變通方法而將你確定會一直存在的東西包裝在 `Option` 中時，最好尋找替代方法，以使你的程式碼更簡潔，錯誤更少。

在這種情況下，存在一個更好的替代方案：`Vec::drain` 方法。它接受一個 range 參數來指定要從 vector 中移除哪些項目，並回傳這些項目的 iterator。傳遞 `..` 範圍語法將從 vector 中移除 *所有* 值。

所以我們需要像這樣更新 `ThreadPool` 的 `drop` 實作：

src/lib.rs

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

這解決了編譯器錯誤，並且不需要對我們的程式碼進行任何其他更改。請注意，由於 `drop` 在發生 panic 時可能會被呼叫，因此 `unwrap` 也可能導致 panic 並引起雙重 panic，這會立即使程式崩潰並結束任何正在進行的清理。對於範例程式來說這沒問題，但不建議用於生產程式碼。

### 向執行緒發出停止監聽 Job 的訊號

我們所做的所有更改，程式碼都可以編譯，沒有任何警告。然而，壞消息是這段程式碼還沒有像我們想要的那樣運作。關鍵在於 `Worker` 實例的執行緒所運行的 closure 中的邏輯：目前，我們呼叫 `join`，但這不會關閉執行緒，因為它們會永遠 `loop` 尋找 job。如果我們嘗試使用當前 `drop` 實作來 drop 我們的 `ThreadPool`，主執行緒將永遠阻塞，等待第一個執行緒完成。

為了解決這個問題，我們需要修改 `ThreadPool` 的 `drop` 實作，然後修改 `Worker` 迴圈。

首先，我們將更改 `ThreadPool` 的 `drop` 實作，在等待執行緒完成之前明確地 drop `sender`。清單 21-23 顯示了對 `ThreadPool` 的更改，以明確地 drop `sender`。與執行緒不同的是，這裡我們 *確實* 需要使用 `Option` 才能夠使用 `Option::take` 將 `sender` 從 `ThreadPool` 中移出。

src/lib.rs

```rust
pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}
// --snip--
impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        // --snip--

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        drop(self.sender.take());

        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

清單 21-23：在 join `Worker` 執行緒之前明確地 drop `sender`

drop `sender` 會關閉 channel，這表示不會再傳送訊息。當這種情況發生時，`Worker` 實例在無限迴圈中對 `recv` 的所有呼叫都會回傳錯誤。在清單 21-24 中，我們修改了 `Worker` 迴圈，使其在這種情況下優雅地退出迴圈，這意味著當 `ThreadPool` 的 `drop` 實作對它們呼叫 `join` 時，執行緒將完成。

src/lib.rs

```rust
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let message = receiver.lock().unwrap().recv();

                match message {
                    Ok(job) => {
                        println!("Worker {id} got a job; executing.");

                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} disconnected; shutting down.");
                        break;
                    }
                }
            }
        });

        Worker { id, thread }
    }
}
```

清單 21-24：當 `recv` 回傳錯誤時，明確地跳出迴圈

為了實際體驗這段程式碼，讓我們修改 `main` 函式，使其在優雅地關閉伺服器之前只接受兩個請求，如清單 21-25 所示。

src/main.rs

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}
```

清單 21-25：透過退出迴圈在服務兩個請求後關閉伺服器

你不會希望真實世界的網頁伺服器在服務兩個請求後就關閉。這段程式碼只是展示了優雅關機和清理功能正常運作。

`take` 方法在 `Iterator` trait 中定義，它將迭代限制為最多前兩個項目。`ThreadPool` 將在 `main` 結束時超出作用域，並且將執行 `drop` 實作。

使用 `cargo run` 啟動伺服器，並發出三個請求。第三個請求應該會出錯，在你的終端機中，你應該會看到類似於以下的輸出：

```
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.41s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Shutting down.
Shutting down worker 0
Worker 3 got a job; executing.
Worker 1 disconnected; shutting down.
Worker 2 disconnected; shutting down.
Worker 3 disconnected; shutting down.
Worker 0 disconnected; shutting down.
Shutting down worker 1
Shutting down worker 2
Shutting down worker 3
```

你可能會看到 `Worker` ID 和印出訊息的不同順序。從訊息中，我們可以看到這段程式碼是如何運作的：`Worker` 實例 0 和 3 處理了前兩個請求。伺服器在第二個連線後停止接受連線，並且 `ThreadPool` 上的 `Drop` 實作在 `Worker` 3 甚至開始其 job 之前就開始執行了。drop `sender` 會斷開所有 `Worker` 實例的連線，並告訴它們關閉。每個 `Worker` 實例在斷開連線時都會印出訊息，然後 thread pool 呼叫 `join` 等待每個 `Worker` 執行緒完成。

請注意此特定執行的一個有趣方面：`ThreadPool` drop 了 `sender`，並且在任何 `Worker` 收到錯誤之前，我們嘗試 join `Worker` 0。`Worker` 0 尚未從 `recv` 收到錯誤，因此主執行緒阻塞，等待 `Worker` 0 完成。同時，`Worker` 3 收到一個 job，然後所有執行緒都收到一個錯誤。當 `Worker` 0 完成時，主執行緒等待其餘的 `Worker` 實例完成。此時，它們都已退出迴圈並停止。

恭喜！我們現在已經完成了我們的專案；我們有一個基本的網頁伺服器，它使用 thread pool 異步回應。我們能夠對伺服器進行優雅關機，它會清理 thread pool 中的所有執行緒。

以下是完整的程式碼供參考：

src/main.rs

```rust
use hello::ThreadPool;
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

src/lib.rs

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        drop(self.sender.take());

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let message = receiver.lock().unwrap().recv();

                match message {
                    Ok(job) => {
                        println!("Worker {id} got a job; executing.");

                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} disconnected; shutting down.");
                        break;
                    }
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

我們可以在這裡做更多事情！如果你想繼續增強這個專案，這裡有一些想法：

* 為 `ThreadPool` 及其公共方法添加更多文件。
* 為函式庫功能添加測試。
* 將對 `unwrap` 的呼叫更改為更穩健的錯誤處理。
* 使用 `ThreadPool` 執行除了服務網頁請求之外的其他任務。
* 在 [crates.io](https://crates.io/) 上找到一個 thread pool crate，並使用該 crate 實作一個類似的網頁伺服器。然後將其 API 和穩健性與我們實作的 thread pool 進行比較。

## 總結

做得好！你已經讀到了本書的結尾！我們衷心感謝你參與這次 Rust 之旅。你現在已經準備好實作你自己的 Rust 專案並協助他人的專案。請記住，還有一個熱情友好的 Rustacean 社群，他們很樂意幫助你解決你在 Rust 旅程中遇到的任何挑戰。