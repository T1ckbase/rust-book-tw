[TOC]

# 列舉型別與模式匹配

在本章中，我們將探討 *列舉型別 (enumerations)*，也稱為 *enum*。enum 允許你透過列舉其可能的 *variant* 來定義一個型別。首先，我們將定義並使用一個 enum，以展示 enum 如何將意義與資料一同編碼。接著，我們將探索一個特別有用的 enum，稱為 `Option`，它表達了一個值可能存在，也可能不存在的情況。然後，我們將探討 `match` 運算式中的模式匹配 (pattern matching) 如何讓我們輕鬆地為 enum 的不同值執行不同的程式碼。最後，我們將介紹 `if let` 建構 (construct) 是另一種方便且簡潔的慣用語 (idiom)，可用於處理程式碼中的 enum。

## 定義一個 Enum

struct 讓你可以將相關的欄位與資料分組在一起，就像一個 `Rectangle` 擁有 `width` 和 `height` 一樣；而 enum 則讓你能夠表達一個值是可能值集合中的其中一個。例如，我們可能希望表達 `Rectangle` 是可能形狀集合中的一種，這些形狀還包括 `Circle` 和 `Triangle`。為此，Rust 允許我們將這些可能性編碼為一個 enum。

讓我們看看一個我們可能希望在程式碼中表達的情境，並了解在這種情況下，為什麼 enum 比 struct 更有用且更合適。假設我們需要處理 IP 位址。目前，有兩個主要的 IP 位址標準：第四版和第六版。由於這些是我們的程式會遇到的 IP 位址唯一可能性，我們可以 *列舉 (enumerate)* 所有可能的 variant，這也是 enumeration 得名的原因。

任何 IP 位址都可以是第四版或第六版，但不能同時是兩者。IP 位址的這種特性使得 enum 資料結構非常適用，因為一個 enum 值只能是其 variant 中的其中一個。第四版和第六版位址本質上都仍然是 IP 位址，因此當程式碼處理適用於任何類型 IP 位址的情境時，它們應該被視為相同型別。

我們可以透過定義一個 `IpAddrKind` enumeration，並列出 IP 位址可能的種類 `V4` 和 `V6`，來在程式碼中表達這個概念。這些是該 enum 的 variant：

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

`IpAddrKind` 現在是一個自訂資料型別，我們可以在程式碼的其他地方使用它。

### Enum 值

我們可以像這樣建立 `IpAddrKind` 兩個 variant 的實例 (instance)：

```rust
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
```

請注意，enum 的 variant 是在它的識別符號下命名空間化的 (namespaced)，我們使用雙冒號 `::` 來分隔兩者。這很有用，因為現在 `IpAddrKind::V4` 和 `IpAddrKind::V6` 這兩個值都屬於相同的型別：`IpAddrKind`。然後，我們可以定義一個接受任何 `IpAddrKind` 的函數，例如：

```rust
fn route(ip_kind: IpAddrKind) {}
```

我們可以呼叫這個函數，傳入任何一個 variant：

```rust
    route(IpAddrKind::V4);
    route(IpAddrKind::V6);
```

使用 enum 還有更多優勢。進一步思考我們的 IP 位址型別，目前我們沒有辦法儲存實際的 IP 位址 *資料*；我們只知道它是什麼 *種類*。鑑於你在[第五章](https://doc.rust-lang.org/book/ch05-00-structs.html)剛剛學過 struct，你可能會想用 struct 來解決這個問題，如程式清單 6-1 所示。

```rust
    enum IpAddrKind {
        V4,
        V6,
    }

    struct IpAddr {
        kind: IpAddrKind,
        address: String,
    }

    let home = IpAddr {
        kind: IpAddrKind::V4,
        address: String::from("127.0.0.1"),
    };

    let loopback = IpAddr {
        kind: IpAddrKind::V6,
        address: String::from("::1"),
    };
```

程式清單 6-1：使用 `struct` 儲存 IP 位址的資料和 `IpAddrKind` variant

在這裡，我們定義了一個 struct `IpAddr`，它有兩個欄位：一個 `kind` 欄位，其型別為 `IpAddrKind` (我們前面定義的 enum)，以及一個 `address` 欄位，其型別為 `String`。我們有這個 struct 的兩個實例。第一個是 `home`，它的 `kind` 值是 `IpAddrKind::V4`，並關聯了位址資料 `127.0.0.1`。第二個實例是 `loopback`。它的 `kind` 值是 `IpAddrKind` 的另一個 variant，`V6`，並關聯了位址 `::1`。我們使用了一個 struct 將 `kind` 和 `address` 值捆綁在一起，所以現在 variant 與值關聯起來了。

然而，只使用 enum 來表達相同的概念會更簡潔：我們可以直接將資料放入每個 enum variant 中，而不是將 enum 放在 struct 裡面。這個 `IpAddr` enum 的新定義表示 `V4` 和 `V6` 兩種 variant 都將擁有相關聯的 `String` 值：

```rust
    enum IpAddr {
        V4(String),
        V6(String),
    }

    let home = IpAddr::V4(String::from("127.0.0.1"));

    let loopback = IpAddr::V6(String::from("::1"));
```

我們直接將資料附加到 enum 的每個 variant 上，因此不需要額外的 struct。在這裡，我們也更容易看到 enum 運作的另一個細節：我們定義的每個 enum variant 的名稱也成為一個建構該 enum 實例的函數。也就是說，`IpAddr::V4()` 是一個函數呼叫，它接受一個 `String` 參數並返回一個 `IpAddr` 型別的實例。定義 enum 後，我們會自動獲得這個建構函數。

使用 enum 而不是 struct 的另一個優點是：每個 variant 可以擁有不同型別和數量的關聯資料。第四版 IP 位址總是會有四個數字組件，其值介於 0 到 255 之間。如果我們想將 `V4` 位址儲存為四個 `u8` 值，但仍然將 `V6` 位址表達為一個 `String` 值，我們就無法使用 struct 來做到。Enum 可以輕鬆處理這種情況：

```rust
    enum IpAddr {
        V4(u8, u8, u8, u8),
        V6(String),
    }

    let home = IpAddr::V4(127, 0, 0, 1);

    let loopback = IpAddr::V6(String::from("::1"));
```

我們已經展示了幾種不同的方式來定義資料結構，以儲存第四版和第六版 IP 位址。然而，事實證明，儲存 IP 位址並編碼它們的種類是非常常見的需求，以至於標準函式庫中就有一個我們可以直接使用的定義！讓我們看看標準函式庫是如何定義 `IpAddr` 的：它擁有與我們定義和使用的完全相同的 enum 和 variant，但它以兩種不同 struct 的形式將位址資料嵌入到 variant 內部，這些 struct 針對每個 variant 有不同的定義：

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

這段程式碼說明了你可以在 enum variant 內部放置任何型別的資料：例如字串、數值型別或 struct。你甚至可以包含另一個 enum！此外，標準函式庫的型別通常不會比你自己想出來的複雜多少。

請注意，即使標準函式庫包含了 `IpAddr` 的定義，我們仍然可以建立和使用自己的定義而不會產生衝突，因為我們尚未將標準函式庫的定義引入到我們的作用域 (scope) 中。我們將在[第七章](https://doc.rust-lang.org/book/ch07-00-packages-crates-and-modules.html)更詳細地討論如何將型別引入作用域。

讓我們看看程式清單 6-2 中的另一個 enum 範例：這個 enum 在其 variant 中嵌入了各種不同型別的資料。

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

程式清單 6-2：一個 `Message` enum，其 variant 各自儲存不同數量和型別的值

這個 enum 有四個不同型別的 variant：

*   `Quit`：完全沒有關聯資料。
*   `Move`：像 struct 一樣有具名欄位 (named fields)。
*   `Write`：包含一個 `String`。
*   `ChangeColor`：包含三個 `i32` 值。

定義一個擁有如程式清單 6-2 中 variant 的 enum，類似於定義不同種類的 struct 定義，只不過 enum 不使用 `struct` 關鍵字，而且所有 variant 都被歸類在 `Message` 型別下。以下 struct 可以儲存與前面 enum variant 相同的資料：

```rust
struct QuitMessage; // unit struct
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // tuple struct
struct ChangeColorMessage(i32, i32, i32); // tuple struct
```

但是，如果我們使用不同的 struct，每個 struct 都有自己的型別，那麼我們就無法像使用程式清單 6-2 中定義的 `Message` enum 那樣，輕鬆地定義一個函數來接受這些不同種類的訊息，因為 `Message` enum 是一個單一型別。

enum 和 struct 之間還有一項相似之處：就像我們能夠使用 `impl` 為 struct 定義方法一樣，我們也能夠為 enum 定義方法。以下是我們可以在 `Message` enum 上定義的一個名為 `call` 的方法：

```rust
    impl Message {
        fn call(&self) {
            // method body would be defined here
        }
    }

    let m = Message::Write(String::from("hello"));
    m.call();
```

方法的函式主體 (body) 會使用 `self` 來獲取我們呼叫該方法的那個值。在這個範例中，我們建立了一個變數 `m`，其值為 `Message::Write(String::from("hello"))`，而當 `m.call()` 執行時，這就是 `call` 方法函式主體中的 `self`。

讓我們看看標準函式庫中另一個非常常見且有用的 enum：`Option`。

### Option Enum 及其相對於 Null 值的優勢

本節探討 `Option` 的案例研究，它是標準函式庫定義的另一個 enum。`Option` 型別編碼了一種非常常見的情境，即一個值可能存在，也可能不存在。

例如，如果你請求一個非空列表中的第一個項目，你將會得到一個值。如果你請求一個空列表中的第一個項目，你將什麼也得不到。在型別系統 (type system) 中表達這個概念，意味著編譯器可以檢查你是否處理了所有應該處理的情況；這項功能可以防止在其他程式語言中極為常見的錯誤。

程式語言設計通常會考慮你包含哪些功能，但你排除的功能也同樣重要。Rust 沒有許多其他語言所擁有的 null 功能。*Null* 是一個表示那裡沒有值的概念。在具有 null 的語言中，變數總是處於兩種狀態之一：null 或非 null (not-null)。

在 Tony Hoare（null 的發明者）2009 年的演講「Null References: The Billion Dollar Mistake」中，他這樣說道：

> I call it my billion-dollar mistake. At that time, I was designing the first
> comprehensive type system for references in an object-oriented language. My
> goal was to ensure that all use of references should be absolutely safe, with
> checking performed automatically by the compiler. But I couldn’t resist the
> temptation to put in a null reference, simply because it was so easy to
> implement. This has led to innumerable errors, vulnerabilities, and system
> crashes, which have probably caused a billion dollars of pain and damage in
> the last forty years.

null 值的問題在於，如果你嘗試將一個 null 值作為非 null 值來使用，你會遇到某種錯誤。由於這種 null 或非 null 的特性普遍存在，所以犯這種錯誤非常容易。

然而，null 試圖表達的概念仍然很有用：null 是一個因為某些原因而目前無效或不存在的值。

問題不在於概念本身，而在於其特定的實作 (implementation)。因此，Rust 沒有 null，但它有一個 enum 可以編碼值存在或不存在的概念。這個 enum 就是 `Option<T>`，它由標準函式庫定義如下：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`Option<T>` enum 非常有用，它甚至被包含在 prelude 中；你不需要明確地將它引入作用域 (scope)。它的 variant 也包含在 prelude 中：你可以直接使用 `Some` 和 `None`，而無需 `Option::` 前綴。`Option<T>` enum 仍然只是一個普通的 enum，而 `Some(T)` 和 `None` 仍然是 `Option<T>` 型別的 variant。

`<T>` 語法是 Rust 中我們尚未討論過的一個功能。它是一個泛型型別參數 (generic type parameter)，我們將在[第十章](https://doc.rust-lang.org/book/ch10-00-generics.html)更詳細地介紹泛型 (generics)。目前，你只需要知道 `<T>` 表示 `Option` enum 的 `Some` variant 可以持有任何型別的單一資料，並且每個具體型別 (concrete type) 在取代 `T` 位置時，都會使整個 `Option<T>` 型別成為一個不同的型別。以下是一些使用 `Option` 值來持有數值型別 (number types) 和字元型別 (char types) 的範例：

```rust
    let some_number = Some(5);
    let some_char = Some('e');

    let absent_number: Option<i32> = None;
```

`some_number` 的型別是 `Option<i32>`。`some_char` 的型別是 `Option<char>`，這是一個不同的型別。Rust 可以推斷 (infer) 這些型別，因為我們在 `Some` variant 內部指定了一個值。對於 `absent_number`，Rust 要求我們標註 (annotate) 整體的 `Option` 型別：編譯器無法僅透過查看 `None` 值來推斷相應 `Some` variant 將持有的型別。在這裡，我們告訴 Rust，我們希望 `absent_number` 是 `Option<i32>` 型別。

當我們有一個 `Some` 值時，我們知道一個值存在，並且該值被包含在 `Some` 裡面。當我們有一個 `None` 值時，在某種意義上，它的意思與 null 相同：我們沒有一個有效的值。那麼，擁有 `Option<T>` 為什麼比擁有 null 更好呢？

簡而言之，因為 `Option<T>` 和 `T`（其中 `T` 可以是任何型別）是不同的型別，編譯器不會讓我們將 `Option<T>` 值當作一個確定有效的值來使用。例如，這段程式碼無法編譯，因為它試圖將一個 `i8` 與一個 `Option<i8>` 相加：

```rust
    let x: i8 = 5;
    let y: Option<i8> = Some(5);

    let sum = x + y;
```

如果我們運行這段程式碼，我們會得到這樣的錯誤訊息：

```
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0277]: cannot add `Option<i8>` to `i8`
 --> src/main.rs:5:17
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + Option<i8>`
  |
  = help: the trait `Add<Option<i8>>` is not implemented for `i8`
  = help: the following other types implement trait `Add<Rhs>`:
            `&i8` implements `Add<i8>`
            `&i8` implements `Add`
            `i8` implements `Add<&i8>`
            `i8` implements `Add`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `enums` (bin "enums") due to 1 previous error
```

令人印象深刻！實際上，這個錯誤訊息表示 Rust 不知道如何將一個 `i8` 和一個 `Option<i8>` 相加，因為它們是不同的型別。在 Rust 中，當我們有一個像 `i8` 這樣型別的值時，編譯器會確保我們總是有一個有效的值。我們可以自信地繼續，而無需在使用該值之前檢查 null。只有當我們有一個 `Option<i8>`（或任何我們正在處理的值的型別）時，我們才需要擔心可能沒有值的情況，而且編譯器會確保我們在使用該值之前處理這種情況。

換句話說，你必須將一個 `Option<T>` 轉換為一個 `T`，才能對它執行 `T` 的操作。通常，這有助於捕獲 null 最常見的問題之一：在某物實際為 null 時，卻假設它不是 null。

消除錯誤假設非 null 值的風險，有助於你對程式碼更有信心。為了擁有一個可能為 null 的值，你必須透過將該值的型別設為 `Option<T>` 來明確地選擇使用 (explicitly opt in)。然後，當你使用該值時，你必須明確地處理該值為 null 的情況。在任何一個值的型別不是 `Option<T>` 的地方，你都可以安全地假設該值不是 null。這是 Rust 的一個刻意設計決策，旨在限制 null 的普遍性 (pervasiveness) 並提高 Rust 程式碼的安全性。

那麼，當你擁有一個 `Option<T>` 型別的值時，你如何從 `Some` variant 中取出 `T` 值，以便你可以使用該值呢？`Option<T>` enum 有大量的 (large number) 方法，這些方法在各種情況下都很有用；你可以在其[文件](https://doc.rust-lang.org/std/option/enum.Option.html)中查看它們。熟悉 `Option<T>` 上的方法將對你的 Rust 之旅極為有用。

通常，為了使用 `Option<T>` 值，你會希望有能處理每個 variant 的程式碼。你希望有些程式碼只在你擁有 `Some(T)` 值時執行，並且這些程式碼允許使用內部的 `T`。你希望有些其他程式碼只在你擁有 `None` 值時執行，而那些程式碼則沒有 `T` 值可用。`match` 運算式是一個控制流建構 (control flow construct)，當與 enum 一起使用時，它就能做到這一點：它會根據 enum 的哪個 variant 存在來執行不同的程式碼，並且該程式碼可以使用匹配值內部的資料。

<a id="the-match-control-flow-operator"></a>

## match 控制流建構

Rust 有一個極其強大的控制流建構，稱為 `match`，它允許你將一個值與一系列模式進行比較，然後根據哪個模式匹配來執行程式碼。模式可以由字面值 (literal values)、變數名稱、萬用字元 (wildcards) 和許多其他東西組成；[第十九章](https://doc.rust-lang.org/book/ch18-00-patterns.html)涵蓋了所有不同種類的模式及其作用。`match` 的強大之處在於模式的表達能力，以及編譯器會確認所有可能的情況都已處理的事實。

將 `match` 運算式想像成一台硬幣分類機：硬幣沿著一條軌道滑下，軌道上有各種大小的孔洞，每個硬幣都會掉進它遇到的第一個適合的孔洞。同樣地，值會通過 `match` 中的每個模式，而在第一個值「適合」的模式處，該值會落入相關聯的程式碼區塊，在執行期間被使用。

說到硬幣，讓我們用它們作為 `match` 的範例！我們可以編寫一個函數，它接受一個未知的美國硬幣，並像點鈔機一樣，判斷它是哪種硬幣並以美分回傳其價值，如程式清單 6-3 所示。

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

程式清單 6-3：一個 enum 和一個將 enum 的 variant 作為其模式的 `match` 運算式

讓我們來分析 `value_in_cents` 函數中的 `match`。首先我們列出 `match` 關鍵字，後面跟著一個運算式 (expression)，在本例中是值 `coin`。這看起來與 `if` 使用的條件運算式非常相似，但有一個很大的區別：`if` 的條件需要評估為一個布林值 (Boolean value)，但這裡它可以是任何型別。本範例中 `coin` 的型別是我們在第一行定義的 `Coin` enum。

接下來是 `match` 的 `匹配分支`。一個 `匹配分支` 有兩部分：一個模式 (pattern) 和一些程式碼。這裡的第一個 `匹配分支` 有一個模式，該模式是值 `Coin::Penny`，然後是 `=>` 運算子，它將模式和要執行的程式碼分開。在本例中，程式碼就只是值 `1`。每個 `匹配分支` 都用逗號與下一個分隔。

當 `match` 運算式執行時，它會依序將結果值與每個 `匹配分支` 的模式進行比較。如果一個模式匹配該值，則執行與該模式相關聯的程式碼。如果該模式不匹配該值，則執行會繼續到下一個 `匹配分支`，就像硬幣分類機一樣。我們需要的 `匹配分支` 數量可以任意多：在程式清單 6-3 中，我們的 `match` 有四個 `匹配分支`。

每個 `匹配分支` 相關聯的程式碼都是一個運算式，而匹配 `匹配分支` 中運算式的結果值，就是整個 `match` 運算式回傳的值。

如果 `match` `匹配分支` 的程式碼很短，我們通常不使用大括號，就像程式清單 6-3 中每個 `匹配分支` 只回傳一個值的情況。如果你想在一個 `match` `匹配分支` 中執行多行程式碼，你必須使用大括號，並且該 `匹配分支` 後面的逗號則可選可不選 (optional)。例如，以下程式碼在每次方法被 `Coin::Penny` 呼叫時都會印出「Lucky penny!」，但仍然回傳區塊的最後一個值，`1`：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### 綁定到值的模式

`match` `匹配分支` 的另一個有用功能是它們可以綁定 (bind) 到與模式匹配的值的部分。這就是我們如何從 enum variant 中提取值的方式。

舉個例子，讓我們改變一個 enum variant，讓它在內部持有資料。從 1999 年到 2008 年，美國鑄造的 25 美分硬幣 (quarters) 在一面印有 50 個州的每個州的獨特設計。其他硬幣都沒有州的設計，所以只有 25 美分硬幣有這個額外的值。我們可以透過修改 `Quarter` variant，讓它包含一個儲存在內部的 `UsState` 值，來將這些資訊新增到我們的 `enum` 中，如程式清單 6-4 所示。

```rust
#[derive(Debug)] // so we can inspect the state in a minute
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}
```

程式清單 6-4：一個 `Coin` enum，其中 `Quarter` variant 也持有 `UsState` 值

讓我們想像一個朋友正在嘗試收集所有 50 個州的 25 美分硬幣。當我們根據硬幣類型整理散錢時，我們也會喊出每個 25 美分硬幣所關聯的州名，這樣如果它是我們朋友沒有的，他們就可以將其加入收藏。

在這段程式碼的 `match` 運算式中，我們在匹配 `Coin::Quarter` variant 值模式中，加入一個名為 `state` 的變數。當 `Coin::Quarter` 匹配時，`state` 變數將綁定到該 25 美分硬幣州的 (state) 值。然後我們就可以在該 `匹配分支` 的程式碼中使用 `state`，像這樣：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {state:?}!");
            25
        }
    }
}
```

如果我們呼叫 `value_in_cents(Coin::Quarter(UsState::Alaska))`，`coin` 將會是 `Coin::Quarter(UsState::Alaska)`。當我們將該值與每個 `match` `匹配分支` 進行比較時，直到我們到達 `Coin::Quarter(state)` 為止，都沒有任何一個匹配。此時，`state` 的綁定將會是值 `UsState::Alaska`。然後我們可以在 `println!` 運算式中使用該綁定，從而從 `Coin` enum 的 `Quarter` variant 中獲取內部的州值。

### 使用 Option<T> 進行模式匹配

在上一節中，我們在使用 `Option<T>` 時，希望從 `Some` 情況中取出內部的 `T` 值；我們也可以使用 `match` 來處理 `Option<T>`，就像我們處理 `Coin` enum 一樣！我們將比較 `Option<T>` 的 variant，而不是比較硬幣，但 `match` 運算式的工作方式保持不變。

假設我們想編寫一個函數，它接受一個 `Option<i32>`，如果裡面有一個值，就將該值加 1。如果裡面沒有值，該函數應該回傳 `None` 值，並且不嘗試執行任何操作。

這個函數由於 `match` 寫起來非常容易，它會像程式清單 6-5 所示。

```rust
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            None => None,
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
```

程式清單 6-5：一個在 `Option<i32>` 上使用 `match` 運算式的函數

讓我們更詳細地檢查 `plus_one` 的第一次執行。當我們呼叫 `plus_one(five)` 時，`plus_one` 函式主體中的變數 `x` 將會是 `Some(5)`。然後我們將其與每個 `match` `匹配分支` 進行比較：

```
            None => None,
```

`Some(5)` 值不匹配模式 `None`，所以我們繼續到下一個 `匹配分支`：

```
            Some(i) => Some(i + 1),
```

`Some(5)` 匹配 `Some(i)` 嗎？是的，它匹配！我們擁有相同的 variant。`i` 綁定到 `Some` 中包含的值，所以 `i` 取值 `5`。然後執行 `match` `匹配分支` 中的程式碼，所以我們將 `i` 的值加 1，並建立一個新的 `Some` 值，其中包含我們的總和 `6`。

現在讓我們考慮程式清單 6-5 中對 `plus_one` 的第二次呼叫，其中 `x` 是 `None`。我們進入 `match` 並與第一個 `匹配分支` 進行比較：

```
            None => None,
```

它匹配！沒有要加的值，所以程式停止並回傳 `=>` 右側的 `None` 值。因為第一個 `匹配分支` 匹配了，所以不會比較其他 `匹配分支`。

結合 `match` 和 enum 在許多情況下都很有用。你會在 Rust 程式碼中經常看到這種模式：對 enum 進行 `match`，將變數綁定到內部的資料，然後根據它執行程式碼。一開始可能有點棘手，但一旦你習慣了，你會希望所有語言都有它。它始終是用戶最愛的功能之一。

### Match 的窮舉性

`match` 還有另一個方面我們需要討論：`匹配分支` 的模式必須涵蓋所有可能性。考慮我們 `plus_one` 函數的這個版本，它有一個錯誤，將無法編譯：

```rust
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            Some(i) => Some(i + 1),
        }
    }
```

我們沒有處理 `None` 的情況，所以這段程式碼會導致錯誤。幸運的是，這是 Rust 知道如何捕獲的錯誤。如果我們嘗試編譯這段程式碼，我們會得到這個錯誤：

```
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0004]: non-exhaustive patterns: `None` not covered
 --> src/main.rs:3:15
  |
3 |         match x {
  |               ^ pattern `None` not covered
  |
note: `Option<i32>` defined here
 --> /rustc/4eb161250e340c8f48f66e2b929ef4a5bed7c181/library/core/src/option.rs:572:1
 ::: /rustc/4eb161250e340c8f48f66e2b929ef4a5bed7c181/library/core/src/option.rs:576:5
  |
  = note: not covered
  = note: the matched value is of type `Option<i32>`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
4 ~             Some(i) => Some(i + 1),
5 ~             None => todo!(),
  |

For more information about this error, try `rustc --explain E0004`.
error: could not compile `enums` (bin "enums") due to 1 previous error
```

Rust 知道我們沒有涵蓋所有可能的情況，甚至知道我們忘記了哪個模式！Rust 中的 `match` 是*窮舉的 (exhaustive)*：我們必須窮盡所有可能性，程式碼才能有效。特別是在 `Option<T>` 的情況下，當 Rust 阻止我們忘記明確處理 `None` 情況時，它保護我們避免在可能為 null 時卻假設有值，從而使前面討論的十億美元錯誤 (billion-dollar mistake) 成為不可能。

### 萬用匹配模式與 `_` 佔位符

使用 enum，我們也可以針對少數特定值採取特殊行動，但對於所有其他值則採取一個預設行動。想像我們正在實作一個遊戲，如果擲骰子擲到 3，你的玩家不會移動，而是獲得一頂新的華麗帽子。如果你擲到 7，你的玩家會失去一頂華麗帽子。對於所有其他值，你的玩家會在遊戲盤上移動該數字的格子。以下是一個 `match`，它實作了這個邏輯，骰子擲出的結果是硬編碼的 (hardcoded) 而不是隨機值，所有其他邏輯都由沒有函式主體的函數表示，因為實際實作它們超出了本範例的範圍：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        other => move_player(other),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn move_player(num_spaces: u8) {}
```

對於前兩個 `匹配分支`，模式是字面值 `3` 和 `7`。對於涵蓋所有其他可能值的最後一個 `匹配分支`，模式是我們選擇命名為 `other` 的變數。為 `other` `匹配分支` 運行的程式碼透過將變數傳遞給 `move_player` 函數來使用該變數。

這段程式碼可以編譯，儘管我們沒有列出 `u8` 可能擁有的所有值，因為最後一個模式將匹配所有未明確列出的值。這個萬用匹配模式 (catch-all pattern) 滿足了 `match` 必須是窮舉性的要求。請注意，我們必須將萬用匹配 `匹配分支` 放在最後，因為模式是依序評估的。如果我們將萬用匹配 `匹配分支` 放在前面，其他 `匹配分支` 將永遠不會執行，所以如果我們在萬用匹配之後添加 `匹配分支`，Rust 會發出警告！

Rust 還有一種模式，我們可以在需要萬用匹配但不想 *使用* 萬用匹配模式中的值時使用：`_` 是一個特殊模式，它匹配任何值，但不將該值綁定。這告訴 Rust 我們不打算使用該值，所以 Rust 不會警告我們有未使用的變數。

讓我們改變遊戲規則：現在，如果你擲出除了 3 或 7 以外的任何數字，你必須重新擲骰子。我們不再需要使用萬用匹配值，所以我們可以將程式碼改為使用 `_` 而不是名為 `other` 的變數：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => reroll(),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn reroll() {}
```

這個範例也符合窮舉性的要求，因為我們在最後一個 `匹配分支` 中明確地忽略了所有其他值；我們沒有遺漏任何東西。

最後，我們將再次改變遊戲規則，這樣如果你擲出除了 3 或 7 以外的任何數字，你的回合就不會發生任何其他事情。我們可以透過將單元值 (unit value) (我們在「[元組型別](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-tuple-type)」一節中提到的空元組型別) 作為與 `_` `匹配分支` 相關聯的程式碼來表達這一點：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => (),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
```

在這裡，我們明確地告訴 Rust，我們不打算使用任何不匹配前面 `匹配分支` 中模式的其他值，並且在這種情況下我們也不想執行任何程式碼。

關於模式和模式匹配 (matching)，我們將在[第十九章](https://doc.rust-lang.org/book/ch18-00-patterns.html)中介紹更多內容。現在，我們將繼續討論 `if let` 語法，在 `match` 運算式顯得有些冗長的情況下，它會很有用。

## 使用 if let 的簡潔控制流

`if let` 語法讓你可以結合 `if` 和 `let`，以一種更簡潔的方式處理匹配單一模式的值，同時忽略其餘的值。考慮程式清單 6-6 中的程式，它匹配 `config_max` 變數中的 `Option<u8>` 值，但只希望在值是 `Some` variant 時執行程式碼。

```rust
    let config_max = Some(3u8);
    match config_max {
        Some(max) => println!("The maximum is configured to be {max}"),
        _ => (),
    }
```

程式清單 6-6：一個只關心在值為 `Some` 時執行程式碼的 `match`

如果值是 `Some`，我們透過將值綁定到模式中的變數 `max`，來印出 `Some` variant 中的值。我們不想對 `None` 值做任何事情。為了滿足 `match` 運算式，我們必須在只處理一個 variant 後添加 `_ => ()`，這是一個令人煩惱的樣板程式碼 (boilerplate code)。

相反地，我們可以使用 `if let` 以更短的方式來編寫這段程式碼。以下程式碼的行為與程式清單 6-6 中的 `match` 相同：

```rust
    let config_max = Some(3u8);
    if let Some(max) = config_max {
        println!("The maximum is configured to be {max}");
    }
```

`if let` 語法接受一個模式和一個由等號分隔的運算式。它的工作方式與 `match` 相同，其中運算式被給予 `match`，而模式是它的第一個 `匹配分支`。在這個例子中，模式是 `Some(max)`，而 `max` 綁定到 `Some` 內部的這個值。然後我們就可以在 `if let` 區塊的函式主體中使用 `max`，就像我們在相應的 `match` `匹配分支` 中使用 `max` 一樣。`if let` 區塊中的程式碼只有在值匹配模式時才會執行。

使用 `if let` 意味著更少的打字、更少的縮排 (indentation) 和更少的樣板程式碼。然而，你將會失去 `match` 所強制執行的窮舉性檢查，該檢查確保你不會忘記處理任何情況。在 `match` 和 `if let` 之間做選擇，取決於你在特定情況下正在做什麼，以及獲得簡潔性是否值得以失去窮舉性檢查為代價。

換句話說，你可以將 `if let` 視為 `match` 的語法糖 (syntax sugar)，它在值匹配一個模式時執行程式碼，然後忽略所有其他值。

我們可以在 `if let` 中包含一個 `else`。與 `else` 搭配的程式碼區塊，與等同於 `if let` 和 `else` 的 `match` 運算式中的 `_` 情況搭配的程式碼區塊相同。回顧程式清單 6-4 中的 `Coin` enum 定義，其中 `Quarter` variant 也持有 `UsState` 值。如果我們想在計算所有非 25 美分硬幣的同時，也宣布 25 美分硬幣的州別，我們可以使用 `match` 運算式來做到這一點，像這樣：

```rust
    let mut count = 0;
    match coin {
        Coin::Quarter(state) => println!("State quarter from {state:?}!"),
        _ => count += 1,
    }
```

或者我們可以使用 `if let` 和 `else` 運算式，像這樣：

```rust
    let mut count = 0;
    if let Coin::Quarter(state) = coin {
        println!("State quarter from {state:?}!");
    } else {
        count += 1;
    }
```

## 使用 let...else 保持「快樂路徑」

常見的模式是當值存在時執行一些計算，否則回傳一個預設值。繼續我們以 `UsState` 值表示的硬幣範例，如果我們想根據 25 美分硬幣上的州有多「老」來說些有趣的話，我們可能會在 `UsState` 上引入一個方法來檢查州的「年齡」，像這樣：

```rust
impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
            // -- snip --
        }
    }
}
```

然後我們可以使用 `if let` 來匹配硬幣的型別，在條件的函式主體內部引入一個 `state` 變數，如程式清單 6-7 所示。

```rust
fn describe_state_quarter(coin: Coin) -> Option<String> {
    if let Coin::Quarter(state) = coin {
        if state.existed_in(1900) {
            Some(format!("{state:?} is pretty old, for America!"))
        } else {
            Some(format!("{state:?} is relatively new."))
        }
    } else {
        None
    }
}
```

程式清單 6-7：透過在 `if let` 內部嵌套條件式來檢查一個州是否存在於 1900 年。

這樣做可以完成任務，但它將工作推入了 `if let` 陳述式的主體，如果要做的工作更複雜，可能會很難精確地追蹤頂層分支是如何關聯的。我們也可以利用運算式會產生值的這個事實，從 `if let` 中產生 `state`，或者提早回傳，如程式清單 6-8 所示。(你也可以用 `match` 做出類似的事情。)

```rust
fn describe_state_quarter(coin: Coin) -> Option<String> {
    let state = if let Coin::Quarter(state) = coin {
        state
    } else {
        return None;
    };

    if state.existed_in(1900) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}
```

程式清單 6-8：使用 `if let` 來產生值或提早回傳。

不過，這以自己的方式來說，有點令人費解！`if let` 的一個分支產生一個值，而另一個分支則直接從函數返回。

為了讓這種常見模式更容易表達，Rust 提供了 `let...else`。`let...else` 語法左側是一個模式，右側是一個運算式，與 `if let` 非常相似，但它沒有 `if` 分支，只有 `else` 分支。如果模式匹配，它將把模式中的值綁定到外部作用域中。如果模式*不*匹配，程式將會進入 `else` `匹配分支`，該 `匹配分支` 必須從函數返回。

在程式清單 6-9 中，你可以看到使用 `let...else` 取代 `if let` 時，程式清單 6-8 會是什麼樣子。

```rust
fn describe_state_quarter(coin: Coin) -> Option<String> {
    let Coin::Quarter(state) = coin else {
        return None;
    };

    if state.existed_in(1900) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}
```

程式清單 6-9：使用 `let...else` 來釐清函數的流程。

請注意，這樣一來，它在函數的主要函式主體中保持在「快樂路徑」上，而不會像 `if let` 那樣，為兩個分支設置顯著不同的控制流。

如果你遇到程式中的邏輯用 `match` 表達會過於冗長的情況，請記住 `if let` 和 `let...else` 也在你的 Rust 工具箱中。

## 總結

我們現在已經介紹了如何使用 enum 來建立自訂型別，這些型別可以是列舉值集合中的一種。我們展示了標準函式庫的 `Option<T>` 型別如何幫助你使用型別系統來防止錯誤。當 enum 值內部包含資料時，你可以使用 `match` 或 `if let` 來提取和使用這些值，這取決於你需要處理多少種情況。

你的 Rust 程式現在可以使用 struct 和 enum 來表達你的領域中的概念。建立自訂型別用於你的 API 可以確保型別安全：編譯器將確保你的函數只接收到每個函數預期的型別值。

為了向你的用戶提供一個組織良好、易於使用且只暴露用戶所需內容的 API，現在讓我們轉向 Rust 的模組 (module)。