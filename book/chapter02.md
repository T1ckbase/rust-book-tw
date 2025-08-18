[TOC]

# 撰寫猜數字遊戲

讓我們動手來寫一個 Rust 專案吧！本章將透過實際程式碼範例，帶你認識一些常見的 Rust 概念。你將會學到 `let`、`match`、methods、associated functions、external crates 等等！接下來的章節會更詳細地探討這些概念。本章你將會先練習這些基礎知識。

我們將實作一個經典的初學者程式設計問題：猜數字遊戲。它的運作方式是這樣的：程式會產生一個 1 到 100 之間的隨機整數，然後提示玩家輸入猜測。玩家輸入猜測後，程式會指出猜測是太低還是太高。如果猜測正確，遊戲將印出恭喜訊息然後結束。

## 設定新專案

要設定一個新專案，請前往你在[第一章](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)中建立的 _projects_ 目錄，並使用 Cargo 建立一個新專案，如下所示：

```
$ cargo new guessing_game
$ cd guessing_game
```

第一個指令 `cargo new` 以專案名稱 (`guessing_game`) 作為第一個引數。第二個指令則切換到新專案的目錄。

查看產生的 _Cargo.toml_ 檔案：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial
rm -rf no-listing-01-cargo-new
cargo new no-listing-01-cargo-new --name guessing_game
cd no-listing-01-cargo-new
cargo run > output.txt 2>&1
cd ../../..
-->

檔案名稱: Cargo.toml

```
[package]
name = "guessing_game"
version = "0.1.0"
edition = "2024"

[dependencies]
```

如你在[第一章](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)所見，`cargo new` 為你產生了一個「Hello, world!」程式。看看 _src/main.rs_ 檔案：

檔案名稱: src/main.rs

```rust
fn main() {
    println!("Hello, world!");
}
```

現在，讓我們使用 `cargo run` 指令，編譯並執行這個「Hello, world!」程式：

```
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.08s
     Running `target/debug/guessing_game`
Hello, world!
```

`run` 指令在你需要快速迭代專案時非常方便，就像我們在這個遊戲中一樣，在進入下一個迭代之前快速測試每個迭代。

重新開啟 _src/main.rs_ 檔案。你將會把所有程式碼寫在這個檔案中。

## 處理猜測

猜數字遊戲的第一部分將要求使用者輸入、處理該輸入，並檢查輸入是否符合預期格式。首先，我們將允許玩家輸入一個猜測。將清單 2-1 中的程式碼輸入到 _src/main.rs_ 中。

src/main.rs

```rust
use std::io;

fn main() {
    println!("Guess the number!");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}
```

清單 2-1：取得使用者猜測並印出的程式碼

這段程式碼包含了許多資訊，所以讓我們逐行檢視。為了取得使用者輸入並將結果印出，我們需要將 `io` 輸入/輸出函式庫引入作用域。`io` 函式庫來自標準函式庫，也就是 `std`：

```rust
use std::io;
```

預設情況下，Rust 在標準函式庫中定義了一組項目，並將其引入每個程式的作用域。這組項目被稱為 _prelude_，你可以在標準函式庫說明文件中的[這裡](https://doc.rust-lang.org/book/std/prelude/index.html)看到所有內容。

如果你想使用的類型不在 prelude 中，你必須使用 `use` 陳述式明確地將該類型引入作用域。使用 `std::io` 函式庫為你提供了許多有用的功能，包括接受使用者輸入的能力。

如你在[第一章](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)所見，`main` 函式是程式的進入點：

```rust
fn main() {
```

`fn` 語法宣告一個新函式；括號 `()` 表示沒有參數；大括號 `{` 則開始函式的主體。

如你也在[第一章](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)中所學到的，`println!` 是一個 macro，用於將字串印到螢幕上：

```rust
    println!("Guess the number!");

    println!("Please input your guess.");
```

這段程式碼印出提示，說明遊戲是什麼並要求使用者輸入。

### 使用變數儲存數值

接下來，我們將建立一個 _variable_ 來儲存使用者輸入，就像這樣：

```rust
let mut guess = String::new();
```

現在程式變得有趣了！這短短的一行包含了許多內容。我們使用 `let` 陳述式來建立變數。以下是另一個範例：

```rust
let apples = 5;
```

這行程式碼建立了一個名為 `apples` 的新變數，並將其綁定到值 5。在 Rust 中，變數預設是 immutable 的，這表示一旦我們給變數一個值，這個值就不會改變。我們將在[第三章](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)中的「變數與可變性（Variables and Mutability）」一節中詳細討論這個概念。要讓變數 mutable，我們在變數名稱前加上 `mut`：

```rust
let apples = 5; // immutable
let mut bananas = 5; // mutable
```

> 註：`//` 語法表示註解的開始，並持續到行尾。Rust 會忽略註解中的所有內容。我們將在[第三章](https://doc.rust-lang.org/book/ch03-05-comments.html)中更詳細地討論註解。

回到猜數字遊戲程式，你現在知道 `let mut guess` 將引入一個名為 `guess` 的 mutable 變數。等號 (`=`) 告訴 Rust 我們現在要將某個東西綁定到這個變數。等號右邊是 `guess` 綁定的值，它是呼叫 `String::new` 的結果，`String::new` 是一個回傳 `String` 新實例的函式。`String` 是標準函式庫提供的一種字串類型，是一種可成長的 UTF-8 編碼文字。

`::new` 行中的 `::` 語法表示 `new` 是 `String` 類型的一個 associated function。_Associated function_ 是在某種類型上實作的函式，在本例中是 `String`。這個 `new` 函式建立一個新的、空的字串。你會在許多類型上找到 `new` 函式，因為它是建立某種新值的常用函式名稱。

總而言之，`let mut guess = String::new();` 這行程式碼已經建立了一個 mutable 變數，它目前綁定到 `String` 的一個新的、空的實例。呼！

### 接收使用者輸入

回想一下，我們在程式的第一行使用 `use std::io;` 包含了標準函式庫的輸入/輸出功能。現在我們將呼叫 `io` 模組中的 `stdin` 函式，這將允許我們處理使用者輸入：

```rust
io::stdin()
    .read_line(&mut guess)
```

如果我們沒有在程式開頭使用 `use std::io;` 引入 `io` 模組，我們仍然可以使用這個函式，方法是將這個函式呼叫寫為 `std::io::stdin`。`stdin` 函式回傳 `std::io::Stdin` 的一個實例，這是一個表示終端機標準輸入句柄的類型。

接下來，`.read_line(&mut guess)` 這行程式碼在標準輸入句柄上呼叫 `read_line` method 以取得使用者的輸入。我們也將 `&mut guess` 作為引數傳遞給 `read_line`，告訴它將使用者輸入儲存在哪個字串中。`read_line` 的完整工作是將使用者輸入到標準輸入中的任何內容附加到字串中（不覆寫其內容），因此我們將該字串作為引數傳遞。字串引數需要是 mutable，以便 method 可以更改字串的內容。

`&` 表示這個引數是一個 _reference_，它提供了一種方式，讓程式碼的多個部分存取一份資料，而不需要多次將該資料複製到記憶體中。References 是一個複雜的功能，而 Rust 的主要優勢之一在於使用 references 的安全性和簡便性。你不需要了解太多這些細節就能完成這個程式。目前，你只需要知道，與變數一樣，references 預設是 immutable 的。因此，你需要寫 `&mut guess` 而不是 `&guess` 來使其 mutable。（[第四章](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)將更徹底地解釋 references。）

<!-- Old heading. Do not remove or links may break. -->

<a id="handling-potential-failure-with-the-result-type"></a>

### 使用 Result 類型處理潛在失敗

我們仍在處理這行程式碼。我們現在討論的是第三行文字，但請注意它仍然是單個邏輯程式碼行的一部分。接下來的部分是這個 method：

```rust
.expect("Failed to read line");
```

我們也可以將這段程式碼寫成：

```rust
io::stdin().read_line(&mut guess).expect("Failed to read line");
```

然而，一行過長的程式碼難以閱讀，因此最好將其分開。當你使用 `.method_name()` 語法呼叫 method 時，通常會明智地引入換行符號和其他空白字元以幫助拆分長行。現在讓我們討論這行程式碼的作用。

如前所述，`read_line` 將使用者輸入的任何內容放入我們傳遞給它的字串中，但它也會回傳一個 `Result` 值。`Result` 是一個 _enumeration_，通常稱為 _enum_，它是一種可以處於多種可能狀態之一的類型。我們將每種可能的狀態稱為一個 _variant_。

[第六章](https://doc.rust-lang.org/book/ch06-00-enums-and-pattern-matching.html)將更詳細地介紹 enums。這些 `Result` 類型的目的是編碼錯誤處理資訊。

`Result` 的 variants 是 `Ok` 和 `Err`。`Ok` variant 表示操作成功，它包含成功產生值。`Err` variant 表示操作失敗，它包含操作如何或為何失敗的資訊。

`Result` 類型的值，就像任何類型的值一樣，都有定義在其上的 methods。`Result` 的實例有一個你可以呼叫的 `expect` method。如果這個 `Result` 的實例是一個 `Err` 值，`expect` 將導致程式崩潰並顯示你作為引數傳遞給 `expect` 的訊息。如果 `read_line` method 回傳 `Err`，它很可能是底層作業系統錯誤的結果。如果這個 `Result` 的實例是一個 `Ok` 值，`expect` 將取得 `Ok` 所持有的回傳值，並將該值直接回傳給你，以便你可以使用它。在本例中，該值是使用者輸入的位元組數。

如果你不呼叫 `expect`，程式將會編譯，但你會收到一個警告：

```
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
warning: unused `Result` that must be used
  --> src/main.rs:10:5
   |
10 |     io::stdin().read_line(&mut guess);
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: this `Result` may be an `Err` variant, which should be handled
   = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
   |
10 |     let _ = io::stdin().read_line(&mut guess);
   |     +++++++

warning: `guessing_game` (bin "guessing_game") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.59s
```

Rust 警告你沒有使用 `read_line` 回傳的 `Result` 值，這表示程式沒有處理可能的錯誤。

抑制警告的正確方法是實際撰寫錯誤處理程式碼，但在我們的例子中，我們只是希望在發生問題時讓程式崩潰，所以我們可以使用 `expect`。你將在[第九章](https://doc.rust-lang.org/book/ch09-00-error-handling.html)中學習如何從錯誤中恢復。

### 使用 println! 預留位置印出值

除了結尾的大括號之外，目前程式碼中還有一行要討論：

```rust
println!("You guessed: {guess}");
```

這行程式碼印出現在包含使用者輸入的字串。 `{}` 這組大括號是一個 placeholder：你可以把它想像成夾住數值的小螃蟹鉗子。當印出變數的值時，變數名稱可以放在大括號內。當印出評估表達式結果時，將空的大括號放在格式字串中，然後在格式字串後面加上一個逗號分隔的表達式列表，以便在每個空的大括號 placeholder 中以相同順序印出。在一次呼叫 `println!` 中印出變數和表達式結果會像這樣：

```rust
let x = 5;
let y = 10;

println!("x = {x} and y + 2 = {}", y + 2);
```

這段程式碼會印出 `x = 5 and y + 2 = 12`。

### 測試第一部分

讓我們測試猜數字遊戲的第一部分。使用 `cargo run` 執行它：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-01/
cargo clean
cargo run
input 6 -->

```
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.44s
     Running `target/debug/guessing_game`
Guess the number!
Please input your guess.
6
You guessed: 6
```

至此，遊戲的第一部分已完成：我們從鍵盤獲取輸入，然後印出它。

## 產生一個秘密數字

接下來，我們需要產生一個使用者將嘗試猜測的秘密數字。秘密數字每次都應該不同，這樣遊戲才有趣，可以玩多次。我們將使用 1 到 100 之間的隨機數字，這樣遊戲就不會太難。Rust 的標準函式庫中尚未包含隨機數字功能。然而，Rust 團隊在 [https://crates.io/crates/rand](https://crates.io/crates/rand) 上提供了一個 `rand` crate，它具有上述功能。

### 使用 Crate 取得更多功能

回想一下，crate 是 Rust 原始碼檔案的集合。我們一直在建立的專案是一個 _binary crate_，也就是一個可執行檔。`rand` crate 是一個 _library crate_，其中包含旨在用於其他程式碼的程式碼，無法自行執行。

Cargo 對外部 crates 的協調是 Cargo 真正閃耀的地方。在使用 `rand` 撰寫程式碼之前，我們需要修改 _Cargo.toml_ 檔案以將 `rand` crate 作為 dependency 包含進來。現在開啟該檔案，並將以下行新增到 `[dependencies]` 區段標頭下方，該標頭是 Cargo 為你建立的。請務必像我們這裡一樣精確地指定 `rand`，並使用此版本號，否則本教學中的程式碼範例可能無法運作：

<!-- When updating the version of `rand` used, also update the version of
`rand` used in these files so they all match:
* ch07-04-bringing-paths-into-scope-with-the-use-keyword.md
* ch14-03-cargo-workspaces.md
-->

檔案名稱: Cargo.toml

```
[dependencies]
rand = "0.8.5"
```

在 _Cargo.toml_ 檔案中，標頭之後的所有內容都屬於該區段，並持續到另一個區段開始。在 `[dependencies]` 中，你告訴 Cargo 你的專案依賴哪些 external crates 以及你需要這些 crates 的哪些版本。在本例中，我們使用 semantic version specifier `0.8.5` 指定了 `rand` crate。Cargo 了解 [Semantic Versioning](https://semver.org/)（有時稱為 _SemVer_），這是一種用於編寫版本號的標準。specifier `0.8.5` 實際上是 `^0.8.5` 的簡寫，表示任何版本至少是 0.8.5 但低於 0.9.0。

Cargo 認為這些版本與 0.8.5 版具有相容的 public APIs，此規範確保你將獲得最新的 patch release，該 release 仍可與本章中的程式碼一起編譯。任何 0.9.0 或更高版本不保證具有與以下範例相同的 API。

現在，不更改任何程式碼，讓我們建立專案，如清單 2-2 所示。

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-02/
rm Cargo.lock
cargo clean
cargo build -->

```
$ cargo build
  Updating crates.io index
   Locking 15 packages to latest Rust 1.85.0 compatible versions
    Adding rand v0.8.5 (available: v0.9.0)
 Compiling proc-macro2 v1.0.93
 Compiling unicode-ident v1.0.17
 Compiling libc v0.2.170
 Compiling cfg-if v1.0.0
 Compiling byteorder v1.5.0
 Compiling getrandom v0.2.15
 Compiling rand_core v0.6.4
 Compiling quote v1.0.38
 Compiling syn v2.0.98
 Compiling zerocopy-derive v0.7.35
 Compiling zerocopy v0.7.35
 Compiling ppv-lite86 v0.2.20
 Compiling rand_chacha v0.3.1
 Compiling rand v0.8.5
 Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.48s
```

清單 2-2：新增 rand crate 作為 dependency 後執行 `cargo build` 的輸出

你可能會看到不同的版本號（但由於 SemVer，它們都與程式碼相容！）和不同的行（取決於作業系統），而且行可能以不同的順序出現。

當我們包含一個 external dependency 時，Cargo 會從 _registry_ 中取得該 dependency 所需的所有最新版本，registry 是 [Crates.io](https://crates.io/) 的資料副本。Crates.io 是 Rust 生態系統中的人們發布他們的開源 Rust 專案供他人使用的地方。

更新 registry 後，Cargo 會檢查 `[dependencies]` 區段並下載任何列出但尚未下載的 crates。在本例中，雖然我們只將 `rand` 列為 dependency，但 Cargo 也取得了 `rand` 為了運作所依賴的其他 crates。下載 crates 後，Rust 會編譯它們，然後再編譯專案，並使 dependencies 可用。

如果你在不進行任何更改的情況下立即再次執行 `cargo build`，除了 `Finished` 行之外，你不會得到任何輸出。Cargo 知道它已經下載並編譯了 dependencies，而且你沒有在 _Cargo.toml_ 檔案中更改它們的任何內容。Cargo 也知道你沒有更改程式碼的任何內容，因此它也不會重新編譯。由於沒有任何事情可做，它只是退出。

如果你打開 _src/main.rs_ 檔案，進行一個微不足道的更改，然後儲存並再次建立，你只會看到兩行輸出：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-02/
touch src/main.rs
cargo build -->

```
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
```

這些行顯示 Cargo 只會使用你對 _src/main.rs_ 檔案的微小更改來更新 build。你的 dependencies 沒有改變，因此 Cargo 知道它可以重複使用它已經下載和編譯的內容。

#### 使用 Cargo.lock 檔案確保可重現的建構

Cargo 有一種機制，可以確保你每次或任何其他人建構你的程式碼時，都能重建相同的 artifact：Cargo 將只使用你指定的 dependency 版本，除非你另有指示。例如，假設下週 `rand` crate 的 0.8.6 版發布，該版本包含一個重要的錯誤修復，但它也包含一個會破壞你的程式碼的 regression。為了處理這個問題，Rust 在你第一次執行 `cargo build` 時會建立 _Cargo.lock_ 檔案，所以我們現在在 _guessing_game_ 目錄中有了這個檔案。

當你第一次建構專案時，Cargo 會找出所有符合標準的 dependency 版本，然後將它們寫入 _Cargo.lock_ 檔案。當你將來建構專案時，Cargo 會看到 _Cargo.lock_ 檔案存在，並將使用其中指定的版本，而不是再次執行所有找出版本的工作。這讓你能夠自動擁有可重現的建構。換句話說，由於 _Cargo.lock_ 檔案的存在，你的專案將保持在 0.8.5 版，直到你明確升級為止。因為 _Cargo.lock_ 檔案對於可重現的建構很重要，所以它通常與專案中的其餘程式碼一起簽入版本控制。

#### 更新 Crate 以取得新版本

當你確實想要更新 crate 時，Cargo 提供了 `update` 命令，它將忽略 _Cargo.lock_ 檔案，並找出 _Cargo.toml_ 中符合你規格的所有最新版本。然後 Cargo 會將這些版本寫入 _Cargo.lock_ 檔案。在本例中，Cargo 只會尋找大於 0.8.5 且小於 0.9.0 的版本。如果 `rand` crate 已經發布了兩個新版本 0.8.6 和 0.9.0，如果你執行 `cargo update`，你會看到以下內容：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-02/
cargo update
assuming there is a new 0.8.x version of rand; otherwise use another update
as a guide to creating the hypothetical output shown here -->

```
$ cargo update
    Updating crates.io index
     Locking 1 package to latest Rust 1.85.0 compatible version
    Updating rand v0.8.5 -> v0.8.6 (available: v0.9.0)
```

Cargo 忽略了 0.9.0 版本。此時，你還會注意到 _Cargo.lock_ 檔案中的變化，其中記錄了你現在使用的 `rand` crate 版本是 0.8.6。要使用 `rand` 0.9.0 版或 0.9._x_ 系列中的任何版本，你必須將 _Cargo.toml_ 檔案更新為以下內容：

```
[dependencies]
rand = "0.9.0"
```

下次你執行 `cargo build` 時，Cargo 將更新可用 crates 的 registry，並根據你指定的新版本重新評估你的 `rand` 需求。

關於 Cargo 及其[生態系統](https://doc.rust-lang.org/book/ch14-00-more-about-cargo-and-crates-io.html)還有很多要說的，我們將在[第十四章](https://doc.rust-lang.org/book/ch14-00-more-about-cargo-and-crates-io.html)中討論，但目前為止，這就是你需要知道的所有內容。Cargo 讓重複使用函式庫變得非常容易，因此 Rustaceans 能夠編寫由多個 packages 組成的小型專案。

### 產生一個隨機數字

讓我們開始使用 `rand` 來產生一個要猜測的數字。下一步是更新 _src/main.rs_，如清單 2-3 所示。

src/main.rs

```rust
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}
```

清單 2-3：新增程式碼以產生一個隨機數字

首先我們新增一行 `use rand::Rng;`。`Rng` trait 定義了 random number generators 實作的 methods，這個 trait 必須在作用域中才能使用這些 methods。我們將在[第十章](https://doc.rust-lang.org/book/ch10-00-generics-traits-and-lifetimes.html)中詳細介紹 traits。

接下來，我們在中間新增了兩行程式碼。在第一行，我們呼叫 `rand::thread_rng` 函式，它提供我們將使用的特定 random number generator：一個對目前執行緒本機的，並由作業系統 seeded 的 generator。然後我們在 random number generator 上呼叫 `gen_range` method。這個 method 由我們使用 `use rand::Rng;` 陳述式引入作用域的 `Rng` trait 所定義。`gen_range` method 接受一個 range expression 作為引數，並在該範圍內產生一個隨機數字。我們這裡使用的 range expression 形式為 `start..=end`，並且在下限和上限都是 inclusive 的，因此我們需要指定 `1..=100` 來要求一個介於 1 到 100 之間的數字。

> 註：你不會只是知道要使用哪些 traits 以及要呼叫 crate 中的哪些 methods 和 functions，因此每個 crate 都會附有使用說明的說明文件。Cargo 的另一個整潔功能是，執行 `cargo doc --open` 命令將在本機建立你所有 dependencies 提供的說明文件，並在你的瀏覽器中開啟它。例如，如果你對 `rand` crate 中的其他功能感興趣，請執行 `cargo doc --open` 並點擊左側側邊欄中的 `rand`。

第二個新行印出秘密數字。這在我們開發程式時很有用，以便能夠測試它，但我們將在最終版本中刪除它。如果程式一開始就印出答案，那就不像個遊戲了！

嘗試執行程式幾次：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-03/
cargo run
4
cargo run
5
-->

```
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 7
Please input your guess.
4
You guessed: 4

$ cargo run
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 83
Please input your guess.
5
You guessed: 5
```

你應該會得到不同的隨機數字，而且它們都應該是介於 1 到 100 之間的數字。做得好！

## 將猜測與秘密數字進行比較

現在我們有了使用者輸入和隨機數字，我們可以將它們進行比較。清單 2-4 顯示了這個步驟。請注意，這段程式碼目前還無法編譯，我們將會解釋原因。

src/main.rs

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    // --snip--

    println!("You guessed: {guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
}
```

清單 2-4：處理比較兩個數字的可能回傳值

首先，我們新增了另一個 `use` 陳述式，將標準函式庫中的 `std::cmp::Ordering` 類型引入作用域。`Ordering` 類型是另一個 enum，它有 `Less`、`Greater` 和 `Equal` 這三個 variants。這是你比較兩個值時可能發生的三種結果。

然後我們在底部新增了五行程式碼，這些程式碼使用了 `Ordering` 類型。`cmp` method 會比較兩個值，並且可以在任何可比較的東西上呼叫。它接受一個 reference 作為你想要比較的對象：這裡它將 `guess` 與 `secret_number` 進行比較。然後它回傳我們用 `use` 陳述式引入作用域的 `Ordering` enum 的一個 variant。我們使用 `match` expression 根據從 `cmp` 呼叫 `guess` 和 `secret_number` 值所回傳的 `Ordering` variant 來決定下一步該怎麼做。

`match` expression 由多個 _arm_ 組成。一個 arm 包含一個要匹配的 _pattern_，以及當給定 `match` 的值符合該 arm 的 pattern 時應該執行的程式碼。Rust 會取得給定 `match` 的值，並依序檢查每個 arm 的 pattern。Patterns 和 `match` 結構是強大的 Rust 功能：它們讓你能夠表達程式碼可能遇到的各種情況，並確保你處理了所有這些情況。這些功能將分別在[第六章](https://doc.rust-lang.org/book/ch06-00-enums-and-pattern-matching.html)和[第十九章](https://doc.rust-lang.org/book/ch19-00-advanced-features.html)中詳細介紹。

讓我們透過這裡使用的 `match` expression 來看一個範例。假設使用者猜測了 50，而這次隨機產生的秘密數字是 38。

當程式碼比較 50 和 38 時，`cmp` method 將回傳 `Ordering::Greater`，因為 50 大於 38。`match` expression 得到 `Ordering::Greater` 值，並開始檢查每個 arm 的 pattern。它查看第一個 arm 的 pattern `Ordering::Less`，發現值 `Ordering::Greater` 不匹配 `Ordering::Less`，所以它忽略該 arm 中的程式碼並移到下一個 arm。下一個 arm 的 pattern 是 `Ordering::Greater`，它*確實*匹配 `Ordering::Greater`！該 arm 中相關的程式碼將會執行，並在螢幕上印出 `Too big!`。`match` expression 在第一次成功匹配後結束，因此在此情境中它不會查看最後一個 arm。

然而，清單 2-4 中的程式碼目前還無法編譯。讓我們試試看：

<!--
The error numbers in this output should be that of the code **WITHOUT** the
anchor or snip comments
-->

```
$ cargo build
   Compiling libc v0.2.86
   Compiling getrandom v0.2.2
   Compiling cfg-if v1.0.0
   Compiling ppv-lite86 v0.2.10
   Compiling rand_core v0.6.2
   Compiling rand_chacha v0.3.0
   Compiling rand v0.8.5
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
error[E0308]: mismatched types
  --> src/main.rs:23:21
   |
23 |     match guess.cmp(&secret_number) {
   |                 --- ^^^^^^^^^^^^^^ expected `&String`, found `&{integer}`
   |                 |
   |                 arguments to this method are incorrect
   |
   = note: expected reference `&String`
              found reference `&{integer}`
note: method defined here
  --> /rustc/4eb161250e340c8f48f66e2b929ef4a5bed7c181/library/core/src/cmp.rs:964:8

For more information about this error, try `rustc --explain E0308`.
error: could not compile `guessing_game` (bin "guessing_game") due to 1 previous error
```

錯誤的核心指出有 _mismatched types_。Rust 有一個強大、靜態的 type system。然而，它也有 type inference。當我們寫 `let mut guess = String::new()` 時，Rust 能夠推斷 `guess` 應該是 `String`，而沒有要求我們寫出類型。另一方面，`secret_number` 是一個 number type。Rust 的一些 number types 可以有介於 1 到 100 之間的值：`i32`，一個 32 位元數字；`u32`，一個 unsigned 32 位元數字；`i64`，一個 64 位元數字；以及其他。除非另有指定，Rust 預設為 `i32`，這是 `secret_number` 的類型，除非你在其他地方添加類型資訊，這將導致 Rust 推斷出不同的數值類型。錯誤的原因是 Rust 無法比較字串和數字類型。

最終，我們希望將程式讀取為輸入的 `String` 轉換為 number type，以便我們可以將其與秘密數字進行數值比較。我們透過在 `main` 函式主體中新增這行程式碼來實現：

檔案名稱: src/main.rs

```rust
    // --snip--

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    let guess: u32 = guess.trim().parse().expect("Please type a number!");

    println!("You guessed: {guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
```

這行程式碼是：

```rust
let guess: u32 = guess.trim().parse().expect("Please type a number!");
```

我們建立了一個名為 `guess` 的變數。但是等等，程式不是已經有一個名為 `guess` 的變數了嗎？確實有，但 Rust 允許我們用一個新的值來 shadowing 之前的 `guess` 值。_Shadowing_ 讓我們可以重複使用 `guess` 變數名稱，而不是強迫我們建立兩個獨特的變數，例如 `guess_str` 和 `guess`。我們將在[第三章](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html#shadowing)中更詳細地介紹這個功能，但現在，你只需要知道這個功能經常用於將一個值從一種類型轉換為另一種類型時。

我們將這個新變數綁定到表達式 `guess.trim().parse()`。表達式中的 `guess` 指的是包含輸入字串的原始 `guess` 變數。`String` 實例上的 `trim` method 將消除開頭和結尾的任何空白字元，這是我們將字串轉換為 `u32` 之前必須做的，因為 `u32` 只能包含數值資料。使用者必須按下 <kbd>enter</kbd> 以滿足 `read_line` 並輸入他們的猜測，這會向字串新增一個換行字元。例如，如果使用者輸入 <kbd>5</kbd> 並按下 <kbd>enter</kbd>，`guess` 看起來會像這樣：`5\n`。`\n` 代表「換行」。(在 Windows 上，按下 <kbd>enter</kbd> 會產生一個回車和一個換行，`\r\n`。) `trim` method 會消除 `\n` 或 `\r\n`，結果只剩下 `5`。

字串上的 `parse` method 會將字串轉換為另一種類型。這裡，我們用它將字串轉換為數字。我們需要透過使用 `let guess: u32` 告訴 Rust 我們想要的確切數字類型。`guess` 後面的冒號 (`:`) 告訴 Rust 我們將註釋變數的類型。Rust 有一些內建的數字類型；這裡看到的 `u32` 是一個 unsigned、32 位元的整數。對於一個小的正數來說，這是一個很好的預設選擇。你將在[第三章](https://doc.rust-lang.org/book/ch03-02-data-types.html)中了解其他數字類型。

此外，此範例程式中的 `u32` 註釋以及與 `secret_number` 的比較表示 Rust 也會推斷 `secret_number` 應該是 `u32`。所以現在的比較將是兩個相同類型的值！

`parse` method 只對可以邏輯上轉換為數字的字元起作用，因此很容易導致錯誤。例如，如果字串包含 `A👍%`，則無法將其轉換為數字。由於它可能會失敗，`parse` method 會回傳一個 `Result` 類型，就像 `read_line` method 一樣（前面在「[使用 Result 類型處理潛在失敗](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#handling-potential-failure-with-the-result-type)」中討論過）。我們將透過再次使用 `expect` method 來以相同的方式處理這個 `Result`。如果 `parse` 回傳 `Err` `Result` variant，因為它無法從字串建立數字，那麼 `expect` 呼叫將會讓遊戲崩潰並印出我們給它的訊息。如果 `parse` 可以成功地將字串轉換為數字，它將回傳 `Result` 的 `Ok` variant，而 `expect` 將會回傳我們從 `Ok` 值中想要的數字。

現在讓我們執行程式：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/no-listing-03-convert-string-to-number/
touch src/main.rs
cargo run
  76
-->

```
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 58
Please input your guess.
  76
You guessed: 76
Too big!
```

太棒了！即使在猜測前增加了空格，程式仍然辨認出使用者猜測了 76。多次執行程式以驗證不同類型輸入的不同行為：正確猜測數字、猜測數字太大和猜測數字太小。

我們現在已經完成了遊戲的大部分功能，但使用者只能猜測一次。讓我們透過新增一個 loop 來改變這一點！

## 透過迴圈允許多次猜測

`loop` 關鍵字會建立一個無限迴圈。我們將新增一個 loop，讓使用者有更多機會猜測數字：

檔案名稱: src/main.rs

```rust
    // --snip--

    println!("The secret number is: {secret_number}");

    loop {
        println!("Please input your guess.");

        // --snip--

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => println!("You win!"),
        }
    }
}
```

如你所見，我們已將從猜測輸入提示開始的所有內容移到一個 loop 中。請務必將 loop 內部的每一行再縮排四個空格，然後再次執行程式。程式現在將永遠要求新的猜測，這實際上引入了一個新問題。使用者似乎無法退出！

使用者總是可以透過鍵盤快捷鍵 <kbd>ctrl</kbd>-<kbd>c</kbd> 中斷程式。但還有另一種方法可以逃離這個貪得無厭的怪物，正如在「[將猜測與秘密數字進行比較](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number)」中的 `parse` 討論中提到的：如果使用者輸入非數字答案，程式將會崩潰。我們可以利用這一點來允許使用者退出，如下所示：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/no-listing-04-looping/
touch src/main.rs
cargo run
(too small guess)
(too big guess)
(correct guess)
quit
-->

```
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.23s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 59
Please input your guess.
45
You guessed: 45
Too small!
Please input your guess.
60
You guessed: 60
Too big!
Please input your guess.
59
You guessed: 59
You win!
Please input your guess.
quit

thread 'main' panicked at src/main.rs:28:47:
Please type a number!: ParseIntError { kind: InvalidDigit }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

輸入 `quit` 將會退出遊戲，但你會注意到，輸入任何其他非數字輸入也會退出。這至少可以說是不理想的；我們希望遊戲在猜對正確數字時也能停止。

### 猜對後退出

讓我們透過新增一個 `break` 陳述式來讓遊戲在使用者獲勝時退出：

檔案名稱: src/main.rs

```rust
        // --snip--

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

在 `You win!` 後新增 `break` 行會讓程式碼在使用者正確猜測秘密數字時退出 loop。退出 loop 也意味著退出程式，因為 loop 是 `main` 的最後一部分。

### 處理無效輸入

為了進一步優化遊戲的行為，當使用者輸入非數字時，我們不讓程式崩潰，而是讓遊戲忽略非數字，這樣使用者就可以繼續猜測。我們可以透過修改將 `guess` 從 `String` 轉換為 `u32` 的那一行來實現這一點，如清單 2-5 所示。

src/main.rs

```rust
        // --snip--

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {guess}");

        // --snip--
```

清單 2-5：忽略非數字猜測並要求再次猜測而不是使程式崩潰

我們從 `expect` 呼叫切換到 `match` expression，以便從錯誤時崩潰轉變為處理錯誤。請記住，`parse` 回傳一個 `Result` 類型，而 `Result` 是一個 enum，它有 `Ok` 和 `Err` 這兩個 variants。我們在這裡使用 `match` expression，就像我們處理 `cmp` method 的 `Ordering` 結果一樣。

如果 `parse` 能夠成功地將字串轉換為數字，它將回傳一個包含結果數字的 `Ok` 值。該 `Ok` 值將匹配第一個 arm 的 pattern，並且 `match` expression 將只回傳 `parse` 生成並放入 `Ok` 值中的 `num` 值。該數字最終將會出現在我們建立的新 `guess` 變數中。

如果 `parse` *無法*將字串轉換為數字，它將回傳一個包含錯誤資訊的 `Err` 值。`Err` 值不匹配第一個 `match` arm 中的 `Ok(num)` pattern，但它匹配第二個 arm 中的 `Err(_)` pattern。底線 `_` 是一個 catch-all 值；在這個範例中，我們說我們想要匹配所有 `Err` 值，無論它們裡面包含什麼資訊。因此，程式將執行第二個 arm 的程式碼 `continue`，這會告訴程式碼進入 `loop` 的下一個 iteration 並要求另一個猜測。因此，實際上，程式碼會忽略 `parse` 可能遇到的所有錯誤！

現在程式中的一切都應該按預期工作。讓我們試試看：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-05/
cargo run
(too small guess)
(too big guess)
foo
(correct guess)
-->

```
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 61
Please input your guess.
10
You guessed: 10
Too small!
Please input your guess.
99
You guessed: 99
Too big!
Please input your guess.
foo
Please input your guess.
61
You guessed: 61
You win!
```

太棒了！再做一個微小的最後調整，我們就完成猜數字遊戲了。回想一下，程式仍然印出秘密數字。這對於測試來說很好，但它破壞了遊戲。讓我們刪除輸出秘密數字的 `println!`。清單 2-6 顯示了最終程式碼。

src/main.rs

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

清單 2-6：完整的猜數字遊戲程式碼

至此，你已成功建立猜數字遊戲。恭喜！

## 總結

這個專案是一個實作的方式，讓你認識許多新的 Rust 概念：`let`、`match`、functions、使用 external crates 等等。在接下來的幾個章節中，你將更詳細地了解這些概念。[第三章](https://doc.rust-lang.org/book/ch03-00-common-programming-concepts.html)涵蓋了大多數程式語言都具備的概念，例如 variables、data types 和 functions，並展示如何在 Rust 中使用它們。[第四章](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)探討了 ownership，這是一個讓 Rust 與其他語言不同的功能。[第五章](https://doc.rust-lang.org/book/ch05-00-structs.html)討論了 structs 和 method syntax，而[第六章](https://doc.rust-lang.org/book/ch06-00-enums-and-pattern-matching.html)則解釋了 enums 的運作方式。
