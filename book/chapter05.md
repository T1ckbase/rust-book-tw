[目錄]

# 使用 Struct 來組織相關資料

_Struct_，或者說_結構_，是一種自訂資料型別，讓你可以將多個相關的值打包在一起並命名，形成一個有意義的群組。如果你熟悉物件導向語言，_struct_ 就像是一個物件的資料屬性。在本章中，我們將比較 tuple 和 struct，以深化你已有的知識，並展示 struct 何時是分組資料更好的方式。

我們將示範如何定義和實例化 struct。我們將討論如何定義 associated functions，特別是稱為 _methods_ 的 associated functions，以指定與 struct 型別相關的行為。Struct 和 enum (在第六章討論) 是在你的程式 domain 中建立新型別的基礎，以便充分利用 Rust 的編譯時型別檢查。

## 定義和實例化 Struct

Struct 與在「The Tuple Type」章節中討論的 tuple 相似，兩者都包含多個相關的值。如同 tuple，struct 的組成部分可以是不同的 type。但與 tuple 不同的是，在 struct 中，你會命名每個資料片段，使其明確表示這些值的意義。增加這些名稱意味著 struct 比 tuple 更靈活：你不需要依賴資料的順序來指定或存取實例的值。

要定義一個 struct，我們輸入關鍵字 `struct` 並為整個 struct 命名。struct 的名稱應該描述被分組資料片段的重要性。然後，在花括號內部，我們定義了資料片段的名稱和 type，我們稱這些為 _fields_。舉例來說，Listing 5-1 展示了一個儲存使用者帳戶資訊的 struct。

src/main.rs

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}
```

Listing 5-1: `User` struct 的定義

在定義完 struct 後要使用它，我們透過為每個 fields 指定具體的值來建立該 struct 的_實例_。我們透過聲明 struct 的名稱，然後添加包含 _`key: value`_ 對的花括號來建立實例，其中 key 是 fields 的名稱，values 是我們想儲存在這些 fields 中的資料。我們不需要按照 struct 中宣告它們的順序來指定 fields。換句話說，struct 定義就像是該 type 的通用 template，而實例則用特定的資料填充該 template，以建立該 type 的值。舉例來說，我們可以按照 Listing 5-2 所示來宣告一個特定的使用者。

src/main.rs

```rust
fn main() {
    let user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };
}
```

Listing 5-2: 建立 `User` struct 的實例

要從 struct 中取得特定值，我們使用點符號 (dot notation)。舉例來說，要存取這位使用者的 email 地址，我們使用 `user1.email`。如果實例是 mutable 的，我們可以透過使用點符號並賦值給特定的 field 來改變其值。Listing 5-3 展示了如何改變 mutable `User` 實例中 `email` field 的值。

src/main.rs

```rust
fn main() {
    let mut user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };

    user1.email = String::from("anotheremail@example.com");
}
```

Listing 5-3: 改變 `User` 實例中 `email` field 的值

請注意，整個實例都必須是 mutable 的；Rust 不允許我們只將某些 fields 標記為 mutable。如同任何 expression，我們可以將 struct 的新實例建構為 function body 中的最後一個 expression，以隱式地回傳該新實例。

Listing 5-4 展示了一個 `build_user` function，它會回傳一個帶有指定 email 和 username 的 `User` 實例。其中 `active` field 獲得 `true` 值，而 `sign_in_count` 獲得 `1` 值。

src/main.rs

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username: username,
        email: email,
        sign_in_count: 1,
    }
}
```

Listing 5-4: 一個 `build_user` function，它接受一個 email 和 username 並回傳一個 `User` 實例

將 function 參數命名為與 struct fields 相同的名稱是合理的，但重複 `email` 和 `username` 的 field 名稱和變數名稱有點繁瑣。如果 struct 有更多 fields，重複每個名稱會變得更加惱人。幸運的是，有一種方便的簡寫方式！

<a id="using-the-field-init-shorthand-when-variables-and-fields-have-the-same-name"></a>

### 使用 Field Init 簡寫語法

由於 Listing 5-4 中的參數名稱和 struct field 名稱完全相同，我們可以使用 _field init shorthand_ 語法來重寫 `build_user`，使其行為完全相同，但避免了 `username` 和 `email` 的重複，如 Listing 5-5 所示。

src/main.rs

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,
        email,
        sign_in_count: 1,
    }
}
```

Listing 5-5: 一個 `build_user` function，它使用 field init shorthand，因為 `username` 和 `email` 參數的名稱與 struct fields 的名稱相同

在這裡，我們正在建立一個新的 `User` struct 實例，該實例有一個名為 `email` 的 field。我們想將 `email` field 的值設定為 `build_user` function 中 `email` 參數的值。因為 `email` field 和 `email` 參數的名稱相同，我們只需要寫 `email` 而不是 `email: email`。

### 使用 Struct Update 語法從其他實例建立實例

建立一個 struct 的新實例，其中包含同一 type 的另一個實例的大部分值，但只改變部分值，這種做法通常很有用。你可以使用 _struct update syntax_ 來做到這一點。

首先，在 Listing 5-6 中，我們展示了如何在 `user2` 中以常規方式建立新的 `User` 實例，而不使用 update syntax。我們為 `email` 設定一個新值，但其他部分則使用我們在 Listing 5-2 中建立的 `user1` 中的相同值。

src/main.rs

```rust
fn main() {
    // --snip--

    let user2 = User {
        active: user1.active,
        username: user1.username,
        email: String::from("another@example.com"),
        sign_in_count: user1.sign_in_count,
    };
}
```

Listing 5-6: 使用 `user1` 中除了其中一個值以外的所有值來建立新的 `User` 實例

使用 struct update syntax，我們可以只用更少的程式碼就達到相同的效果，如 Listing 5-7 所示。語法 `..` 指定了未明確設定的其餘 fields 應該具有與給定實例中 fields 相同的值。

src/main.rs

```rust
fn main() {
    // --snip--

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    };
}
```

Listing 5-7: 使用 struct update syntax 來為 `User` 實例設定一個新的 `email` 值，但其餘值則來自 `user1`

Listing 5-7 中的程式碼也在 `user2` 中建立了一個實例，該實例的 `email` 值不同，但 `username`、`active` 和 `sign_in_count` fields 的值與 `user1` 相同。其中 `..user1` 必須放在最後，以指定任何剩餘的 fields 都應從 `user1` 中對應的 fields 獲取值，但我們可以選擇以任何順序指定任意數量的 fields 的值，無論 struct 定義中 fields 的順序如何。

請注意，struct update syntax 使用 `=` 就像賦值一樣；這是因為它會移動資料，就像我們在「Variables and Data Interacting with Move」章節中看到的那樣。在這個例子中，建立 `user2` 之後我們就不能再使用 `user1` 了，因為 `user1` 的 `username` field 中的 `String` 已被 move 到 `user2`。如果我們為 `user2` 的 `email` 和 `username` 都提供了新的 `String` 值，因此只使用了 `user1` 的 `active` 和 `sign_in_count` 值，那麼在建立 `user2` 之後 `user1` 仍然會是有效的。`active` 和 `sign_in_count` 都是實作了 `Copy` trait 的 type，因此我們在「Stack-Only Data: Copy」章節中討論的行為將適用。在這個例子中，我們仍然可以使用 `user1.email`，因為它的值沒有從 `user1` 中被 move 出來。

### 使用沒有命名 fields 的 Tuple Struct 來建立不同的 Type

Rust 也支援看起來像 tuple 的 struct，稱為 _tuple structs_。Tuple structs 具有 struct 名稱所提供的額外意義，但其 fields 沒有關聯的名稱；相反地，它們只有 fields 的 type。Tuple structs 在你希望為整個 tuple 命名並使其成為與其他 tuple 不同的 type 時很有用，以及當像常規 struct 那樣命名每個 field 會顯得冗長或重複時。

要定義一個 tuple struct，請以 `struct` 關鍵字和 struct 名稱開頭，後面接著 tuple 中的 type。舉例來說，這裡我們定義並使用了兩個名為 `Color` 和 `Point` 的 tuple structs：

src/main.rs

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}
```

請注意，`black` 和 `origin` 的值是不同的 type，因為它們是不同 tuple structs 的實例。你定義的每個 struct 都是它自己的 type，即使 struct 內的 fields 可能具有相同的 type。舉例來說，一個接受 `Color` type 參數的 function 無法接受 `Point` 作為參數，即使這兩種 type 都由三個 `i32` 值組成。否則，tuple struct 實例與 tuple 相似，你可以將它們解構為各自的組成部分，並且可以使用 `.` 後跟索引來存取個別值。與 tuple 不同，當你解構 tuple structs 時，你需要命名 struct 的 type。舉例來說，我們會寫 `let Point(x, y, z) = origin;` 來將 `origin` 點中的值解構到名為 `x`、`y` 和 `z` 的變數中。

### 不帶任何 Field 的 Unit-Like Struct

你也可以定義不帶任何 fields 的 struct！這些稱為 _unit-like structs_，因為它們的行為與我們在「The Tuple Type」章節中提到的 unit type `()` 相似。當你需要為某個 type 實作一個 trait 但不想在 type 本身儲存任何資料時，unit-like structs 可能會很有用。我們將在第十章討論 traits。以下是宣告和實例化一個名為 `AlwaysEqual` 的 unit struct 的範例：

src/main.rs

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

要定義 `AlwaysEqual`，我們使用 `struct` 關鍵字、我們想要的名稱，然後是分號。不需要花括號或括號！然後我們可以用類似的方式在 `subject` 變數中取得 `AlwaysEqual` 的實例：使用我們定義的名稱，不需要任何花括號或括號。想像一下，之後我們將為這種 type 實作一個行為，使得 `AlwaysEqual` 的每個實例總是等於任何其他 type 的每個實例，也許是為了測試目的而得到一個已知結果。我們不需要任何資料來實作該行為！你將在第十章看到如何定義 traits 並在任何 type 上實作它們，包括 unit-like structs。

> ### Struct 資料的 Ownership
>
> 在 Listing 5-1 的 `User` struct 定義中，我們使用了 owned 的 `String` type 而不是 `&str` string slice type。這是一個有意的選擇，因為我們希望這個 struct 的每個實例都擁有其所有資料，並且該資料在整個 struct 有效期間都保持有效。
>
> Structs 也可以儲存對其他東西所擁有資料的 reference，但這樣做需要使用 _lifetimes_，這是 Rust 的一個功能，我們將在第十章討論。Lifetimes 確保 struct 參考的資料在 struct 有效期間都保持有效。假設你嘗試在 struct 中儲存一個 reference，但沒有指定 lifetimes，如下所示；這將無法運作：
>
> <Listing file-name="src/main.rs">
>
> <!-- CAN'T EXTRACT SEE https://github.com/rust-lang/mdBook/issues/1127 -->
>
> ```rust,ignore,does_not_compile
> struct User {
>     active: bool,
>     username: &str,
>     email: &str,
>     sign_in_count: u64,
> }
>
> fn main() {
>     let user1 = User {
>         active: true,
>         username: "someusername123",
>         email: "someone@example.com",
>         sign_in_count: 1,
>     };
> }
> ```
>
> </Listing>
>
> 編譯器將會抱怨它需要 lifetime specifiers：
>
> ```console
> $ cargo run
>    Compiling structs v0.1.0 (file:///projects/structs)
> error[E0106]: missing lifetime specifier
>  --> src/main.rs:3:15
>   |
> 3 |     username: &str,
>   |               ^ expected named lifetime parameter
>   |
> help: consider introducing a named lifetime parameter
>   |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 ~     username: &'a str,
>   |
>
> error[E0106]: missing lifetime specifier
>  --> src/main.rs:4:12
>   |
> 4 |     email: &str,
>   |            ^ expected named lifetime parameter
>   |
> help: consider introducing a named lifetime parameter
>   |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 |     username: &str,
> 4 ~     email: &'a str,
>   |
>
> For more information about this error, try `rustc --explain E0106`.
> error: could not compile `structs` (bin "structs") due to 2 previous errors
> ```
>
> 在第十章中，我們將討論如何修正這些錯誤，以便你可以在 struct 中儲存 references，但目前，我們將使用像 `String` 這樣的 owned types 來修正這些錯誤，而不是像 `&str` 這樣的 references。

## 使用 Struct 的程式範例

為了理解我們何時可能想使用 struct，讓我們來編寫一個計算矩形面積的程式。我們將從使用單一變數開始，然後重構程式直到我們改用 struct。

讓我們使用 Cargo 建立一個新的 binary project，名為 _rectangles_，它將接受以像素指定的矩形寬度和高度，並計算矩形的面積。Listing 5-8 展示了一個簡短的程式，這是我們專案中 _src/main.rs_ 裡實現此目標的一種方式。

src/main.rs

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;

    println!(
        "The area of the rectangle is {} square pixels.",
        area(width1, height1)
    );
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

Listing 5-8: 計算由獨立寬度和高度變數指定的矩形面積

現在，使用 `cargo run` 執行此程式：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/rectangles`
The area of the rectangle is 1500 square pixels.
```

這段程式碼透過呼叫 `area` function 並傳入每個維度成功地計算出矩形面積，但我們可以做更多事情來使這段程式碼更清晰和易讀。

這段程式碼的問題在 `area` 的 signature 中顯而易見：

```rust
fn area(width: u32, height: u32) -> u32 {
```

這個 `area` function 應該計算一個矩形的面積，但我們寫的 function 有兩個參數，而且在我們的程式中沒有任何地方清楚地表明這些參數是相關的。將 width 和 height 分組在一起會更具可讀性且更易於管理。我們已經在第三章的「The Tuple Type」章節中討論過一種可能的方式：使用 tuples。

### 使用 Tuple 重構

Listing 5-9 展示了我們程式的另一個使用 tuples 的版本。

src/main.rs

```rust
fn main() {
    let rect1 = (30, 50);

    println!(
        "The area of the rectangle is {} square pixels.",
        area(rect1)
    );
}

fn area(dimensions: (u32, u32)) -> u32 {
    dimensions.0 * dimensions.1
}
```

Listing 5-9: 使用 tuple 指定矩形的寬度和高度

在某種程度上，這個程式更好。Tuples 讓我們可以增加一點結構，而且我們現在只傳遞一個參數。但從另一個角度來看，這個版本不夠清晰：tuples 不會命名它們的元素，所以我們必須透過索引來存取 tuple 的部分，這使得我們的計算不那麼明顯。

將 width 和 height 混淆對於面積計算來說並不重要，但如果我們想在螢幕上繪製矩形，這就會很重要！我們必須記住 `width` 是 tuple 索引 `0`，而 `height` 是 tuple 索引 `1`。如果其他人要使用我們的程式碼，這將更難以理解和記住。因為我們沒有在程式碼中傳達資料的意義，現在更容易引入錯誤。

### 使用 Struct 重構：增加更多意義

我們使用 struct 透過為資料加上標籤來增加意義。我們可以將正在使用的 tuple 轉換為 struct，為整體和各部分命名，如 Listing 5-10 所示。

src/main.rs

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        area(&rect1)
    );
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

Listing 5-10: 定義 `Rectangle` struct

在這裡，我們定義了一個 struct 並命名為 `Rectangle`。在花括號內部，我們將 fields 定義為 `width` 和 `height`，兩者都具有 `u32` type。然後，在 `main` 中，我們建立了一個特定的 `Rectangle` 實例，其寬度為 `30`，高度為 `50`。

我們的 `area` function 現在定義只有一個參數，我們將其命名為 `rectangle`，其 type 是 `Rectangle` struct 實例的 immutable borrow。正如第四章所提及的，我們希望 borrow 這個 struct，而不是取得它的 ownership。這樣一來，`main` 就可以保留它的 ownership，並可以繼續使用 `rect1`，這就是我們在 function signature 中使用 `&` 以及呼叫 function 時使用 `&` 的原因。

這個 `area` function 存取 `Rectangle` 實例的 `width` 和 `height` fields (請注意，存取被 borrow 的 struct 實例的 fields 並不會 move field 值，這就是為什麼你經常看到 struct 的 borrows)。我們的 `area` function signature 現在精確地表達了我們的意圖：計算 `Rectangle` 的面積，使用它的 `width` 和 `height` fields。這傳達了 width 和 height 彼此相關，並且為這些值賦予了描述性的名稱，而不是使用 tuple 索引值 `0` 和 `1`。這對清晰度而言是一大勝利。

### 使用 Derived Traits 增加實用功能

在程式除錯時，如果能夠印出 `Rectangle` 的實例並看到其所有 fields 的值，那會很有用。Listing 5-11 嘗試使用我們在前幾章中用過的 `println!` macro。然而，這將無法運作。

src/main.rs

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {rect1}");
}
```

Listing 5-11: 嘗試印出 `Rectangle` 實例

當我們編譯這段程式碼時，我們會得到一個錯誤，其核心訊息是：

```text
error[E0277]: `Rectangle` doesn't implement `std::fmt::Display`
```

`println!` macro 可以進行多種格式化，預設情況下，花括號會告訴 `println!` 使用稱為 `Display` 的格式：一種用於直接供終端使用者閱讀的輸出。我們目前看到的基本 type 預設都實作了 `Display`，因為你只有一種方式會想向使用者顯示 `1` 或任何其他基本 type。但對於 struct 而言，`println!` 應該如何格式化輸出就沒那麼清楚了，因為有更多的顯示可能性：你想要逗號嗎？你想要印出花括號嗎？是否所有 fields 都應該顯示？由於這種模糊性，Rust 不會嘗試猜測我們想要什麼，而且 struct 沒有提供 `Display` 的實作來與 `println!` 和 `{}` 佔位符一起使用。

如果我們繼續閱讀錯誤訊息，我們會找到這個有用的提示：

```text
= help: the trait `std::fmt::Display` is not implemented for `Rectangle`
= note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
```

我們來試試看！現在 `println!` macro 呼叫將會像 `println!("rect1 is {rect1:?}");`。將 specifier `:?` 放在花括號內部，會告訴 `println!` 我們想使用一種稱為 `Debug` 的輸出格式。`Debug` trait 使我們能夠以對開發人員有用的方式印出我們的 struct，這樣我們在除錯程式碼時就可以看到它的值。

用這個改變來編譯程式碼。哎呀！我們仍然得到一個錯誤：

```text
error[E0277]: `Rectangle` doesn't implement `Debug`
```

但同樣地，編譯器又給了我們一個有用的提示：

```text
= help: the trait `Debug` is not implemented for `Rectangle`
= note: add `#[derive(Debug)]` to `Rectangle` or manually `impl Debug for Rectangle`
```

Rust *確實*包含印出除錯資訊的功能，但我們必須明確地選擇啟用，才能使該功能對我們的 struct 可用。為此，我們在 struct 定義之前添加外層 attribute `#[derive(Debug)]`，如 Listing 5-12 所示。

src/main.rs

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {rect1:?}");
}
```

Listing 5-12: 添加 attribute 以 derive `Debug` trait 並使用 debug 格式化印出 `Rectangle` 實例

現在，當我們執行程式時，將不會收到任何錯誤，並且會看到以下輸出：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle { width: 30, height: 50 }
```

不錯！這不是最漂亮的輸出，但它顯示了此實例所有 fields 的值，這在除錯期間肯定會有所幫助。當我們有更大的 structs 時，擁有更容易閱讀的輸出會很有用；在這些情況下，我們可以在 `println!` 字串中使用 `{:#?}` 而不是 `{:?}`。在這個例子中，使用 `{:#?}` 樣式將會輸出以下內容：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle {
    width: 30,
    height: 50,
}
```

另一種使用 `Debug` 格式印出值的方式是使用 `dbg!` macro，它會取得 expression 的 ownership (與 `println!` 不同，後者接受 reference)，並印出 `dbg!` macro 呼叫在你程式碼中發生的檔案和行號，以及該 expression 的結果值，最後返回值的 ownership。

> 注意：呼叫 `dbg!` macro 會印到 standard error console stream (`stderr`)，與 `println!` 不同，後者會印到 standard output console stream (`stdout`)。我們將在第十二章的「Writing Error Messages to Standard Error Instead of Standard Output」章節中討論更多關於 `stderr` 和 `stdout` 的內容。

這裡有一個範例，我們對被賦予 `width` field 的值以及 `rect1` 中整個 struct 的值感興趣：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let scale = 2;
    let rect1 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };

    dbg!(&rect1);
}
```

我們可以將 `dbg!` 放在 expression `30 * scale` 周圍，因為 `dbg!` 會回傳 expression 值的 ownership，所以 `width` field 將會得到與沒有 `dbg!` 呼叫時相同的值。我們不希望 `dbg!` 取得 `rect1` 的 ownership，所以在下一次呼叫中我們使用 `rect1` 的 reference。這個範例的輸出如下所示：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running `target/debug/rectangles`
[src/main.rs:10:16] 30 * scale = 60
[src/main.rs:14:5] &rect1 = Rectangle {
    width: 60,
    height: 50,
}
```

我們可以看到第一部分輸出來自 _src/main.rs_ 第 10 行，我們正在對 expression `30 * scale` 進行除錯，其結果值為 `60` (為整數實作的 `Debug` 格式化只會印出它們的值)。_src/main.rs_ 第 14 行的 `dbg!` 呼叫輸出了 `&rect1` 的值，也就是 `Rectangle` struct。這個輸出使用了 `Rectangle` type 的美觀 `Debug` 格式化。當你嘗試找出程式碼在做什麼時，`dbg!` macro 會非常有用！

除了 `Debug` trait 之外，Rust 還提供了許多可供我們與 `derive` attribute 搭配使用的 traits，這些 traits 可以為我們的自訂 type 添加實用行為。這些 traits 及其行為列在附錄 C 中。我們將在第十章介紹如何實作這些帶有自訂行為的 traits，以及如何建立自己的 traits。除了 `derive` 之外還有許多其他 attributes；更多資訊請參閱 Rust Reference 的「Attributes」章節，網址為 [https://doc.rust-lang.org/book/reference/attributes.html](https://doc.rust-lang.org/book/reference/attributes.html)。

我們的 `area` function 非常具體：它只計算矩形的面積。將此行為與我們的 `Rectangle` struct 更緊密地綁定會很有幫助，因為它無法與任何其他 type 配合使用。讓我們看看如何透過將 `area` function 變成在 `Rectangle` type 上定義的 `area` _method_ 來繼續重構這段程式碼。

## Method 語法

_Methods_ 與 functions 相似：我們使用 `fn` 關鍵字和一個名稱來宣告它們，它們可以有參數和回傳值，並且包含一些在 method 從其他地方被呼叫時執行的程式碼。與 functions 不同的是，methods 是在 struct 的 context (或 enum 或 trait object，我們分別在第六章和第十八章討論) 中定義的，而且它們的第一個參數始終是 `self`，它代表呼叫該 method 的 struct 實例。

### 定義 Methods

讓我們將以 `Rectangle` 實例作為參數的 `area` function，改為在 `Rectangle` struct 上定義一個 `area` method，如 Listing 5-13 所示。

src/main.rs

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

Listing 5-13: 在 `Rectangle` struct 上定義 `area` method

要在 `Rectangle` 的 context 中定義 function，我們為 `Rectangle` 開始一個 `impl` (實作) block。這個 `impl` block 內的所有內容都將與 `Rectangle` type 相關聯。然後我們將 `area` function 移到 `impl` 的花括號內，並將 signature 中和 body 內的第一個 (也是唯一一個) 參數改為 `self`。在 `main` 中，我們呼叫 `area` function 並傳遞 `rect1` 作為參數的地方，現在可以使用 _method syntax_ 來在我們的 `Rectangle` 實例上呼叫 `area` method。method 語法跟在實例後面：我們添加一個點，然後是 method 名稱、括號和任何參數。

在 `area` 的 signature 中，我們使用 `&self` 而不是 `rectangle: &Rectangle`。`&self` 實際上是 `self: &Self` 的簡寫。在 `impl` block 中，type `Self` 是該 `impl` block 所針對的 type 的 alias。Methods 的第一個參數必須是 `Self` type 且名為 `self`，因此 Rust 允許你只在第一個參數位置使用 `self` 來縮寫。請注意，我們仍然需要在 `self` 簡寫前面使用 `&`，以表示此 method borrow 了 `Self` 實例，就像我們在 `rectangle: &Rectangle` 中所做的那樣。Methods 可以取得 `self` 的 ownership，像我們在這裡一樣 immutable borrow `self`，或者 mutable borrow `self`，就像它們可以對任何其他參數一樣。

我們在這裡選擇 `&self` 的原因與在 function 版本中使用 `&Rectangle` 的原因相同：我們不希望取得 ownership，我們只想讀取 struct 中的資料，而不是寫入它。如果我們想改變呼叫 method 的實例，作為 method 動作的一部分，我們會使用 `&mut self` 作為第一個參數。使用 `self` 作為第一個參數來取得實例 ownership 的 method 很少見；這種技術通常用於當 method 將 `self` 轉換為其他東西，並且你想在轉換後阻止呼叫者使用原始實例時。

使用 methods 而不是 functions 的主要原因，除了提供 method 語法和不必在每個 method 的 signature 中重複 `self` 的 type 之外，是為了組織性。我們將所有可以對某個 type 的實例執行的操作都放在一個 `impl` block 中，而不是讓未來使用我們程式碼的人在我們提供的 library 的各個地方尋找 `Rectangle` 的功能。

請注意，我們可以選擇為 method 賦予與 struct 其中一個 field 相同的名稱。舉例來說，我們可以在 `Rectangle` 上定義一個也名為 `width` 的 method：

src/main.rs

```rust
impl Rectangle {
    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    if rect1.width() {
        println!("The rectangle has a nonzero width; it is {}", rect1.width);
    }
}
```

在這裡，我們選擇讓 `width` method 在實例的 `width` field 值大於 `0` 時回傳 `true`，在值為 `0` 時回傳 `false`：我們可以為了任何目的在同名 method 內使用 field。在 `main` 中，當我們在 `rect1.width` 後加上括號時，Rust 知道我們指的是 `width` method。當我們不使用括號時，Rust 知道我們指的是 `width` field。

通常 (但非總是如此)，當我們給 method 與 field 相同的名稱時，我們希望它只回傳 field 中的值，而不做其他事情。像這樣的 methods 稱為 _getters_，Rust 不會像其他一些語言那樣自動為 struct fields 實作它們。Getters 很有用，因為你可以將 field 設為 private，但將 method 設為 public，從而允許對該 field 的唯讀存取作為 type 的 public API 的一部分。我們將在第七章討論 public 和 private 是什麼，以及如何將 field 或 method 指定為 public 或 private。

> ### -> 運算子在哪裡？
>
> 在 C 和 C++ 中，呼叫 methods 使用兩種不同的運算子：如果你直接在 object 上呼叫 method，使用 `.`；如果你在指向 object 的 pointer 上呼叫 method 並需要先 dereference 該 pointer，則使用 `->`。換句話說，如果 `object` 是一個 pointer，`object->something()` 與 `(*object).something()` 相似。
>
> Rust 沒有等同於 `->` 運算子的東西；相反地，Rust 有一個稱為 _automatic referencing and dereferencing_ 的功能。呼叫 methods 是 Rust 中少數有此行為的地方之一。
>
> 它的運作方式如下：當你使用 `object.something()` 呼叫 method 時，Rust 會自動加入 `&`、`&mut` 或 `*`，以便 `object` 符合 method 的 signature。換句話說，以下是相同的：
>
> <!-- CAN'T EXTRACT SEE BUG https://github.com/rust-lang/mdBook/issues/1127 -->
>
> ```rust
> # #[derive(Debug,Copy,Clone)]
> # struct Point {
> #     x: f64,
> #     y: f64,
> # }
> #
> # impl Point {
> #    fn distance(&self, other: &Point) -> f64 {
> #        let x_squared = f64::powi(other.x - self.x, 2);
> #        let y_squared = f64::powi(other.y - self.y, 2);
> #
> #        f64::sqrt(x_squared + y_squared)
> #    }
> # }
> # let p1 = Point { x: 0.0, y: 0.0 };
> # let p2 = Point { x: 5.0, y: 6.5 };
> p1.distance(&p2);
> (&p1).distance(&p2);
> ```
>
> 第一種看起來更簡潔。這種 automatic referencing 行為之所以有效，是因為 methods 有一個明確的 receiver——也就是 `self` 的 type。給定 method 的 receiver 和名稱，Rust 可以明確地判斷該 method 是讀取 (`&self`)、修改 (`&mut self`) 還是消耗 (`self`)。Rust 對 method receivers 進行 implicit borrowing 的事實，是使 ownership 在實踐中變得 ergonomic 的重要一環。

### 帶有多個參數的 Methods

讓我們透過在 `Rectangle` struct 上實作第二個 method 來練習使用 methods。這次我們希望 `Rectangle` 的一個實例能夠接受另一個 `Rectangle` 實例，如果第二個 `Rectangle` 可以完全放入 `self` (第一個 `Rectangle`) 則回傳 `true`；否則，回傳 `false`。也就是說，一旦我們定義了 `can_hold` method，我們希望能夠編寫如 Listing 5-14 所示的程式。

src/main.rs

```rust
fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

Listing 5-14: 使用尚未編寫的 `can_hold` method

預期的輸出將如下所示，因為 `rect2` 的兩個維度都小於 `rect1` 的維度，但 `rect3` 比 `rect1` 更寬：

```console
Can rect1 hold rect2? true
Can rect1 hold rect3? false
```

我們知道我們想定義一個 method，所以它將在 `impl Rectangle` block 內。method 名稱將是 `can_hold`，它將接受另一個 `Rectangle` 的 immutable borrow 作為參數。我們可以透過查看呼叫該 method 的程式碼來判斷參數的 type：`rect1.can_hold(&rect2)` 傳入 `&rect2`，這是對 `rect2` (一個 `Rectangle` 的實例) 的 immutable borrow。這很合理，因為我們只需要讀取 `rect2` (而不是寫入，寫入會需要 mutable borrow)，而且我們希望 `main` 保留 `rect2` 的 ownership，以便在呼叫 `can_hold` method 後我們可以再次使用它。`can_hold` 的回傳值將是一個 Boolean 值，實作將檢查 `self` 的 width 和 height 是否分別大於另一個 `Rectangle` 的 width 和 height。讓我們將新的 `can_hold` method 添加到 Listing 5-13 的 `impl` block 中，如 Listing 5-15 所示。

src/main.rs

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

Listing 5-15: 在 `Rectangle` 上實作 `can_hold` method，它接受另一個 `Rectangle` 實例作為參數

當我們使用 Listing 5-14 中的 `main` function 執行這段程式碼時，將會得到我們預期的輸出。Methods 可以接受多個參數，我們將其添加到 `self` 參數之後的 signature 中，這些參數的運作方式與 functions 中的參數相同。

### Associated Functions

在 `impl` block 內定義的所有 functions 都稱為 _associated functions_，因為它們與 `impl` 後面命名的 type 相關聯。我們可以定義 associated functions，這些 functions 的第一個參數不是 `self` (因此它們不是 methods)，因為它們不需要 type 的實例來運作。我們已經使用過一個這樣的 function：在 `String` type 上定義的 `String::from` function。

不是 methods 的 associated functions 通常用於 constructors，它們將回傳 struct 的新實例。這些通常被稱為 `new`，但 `new` 不是一個特殊名稱，也不是內建在語言中的。舉例來說，我們可以選擇提供一個名為 `square` 的 associated function，它將有一個維度參數，並將其同時用作 width 和 height，這樣可以更容易地建立一個正方形 `Rectangle`，而無需重複指定相同的值：

Filename: src/main.rs

```rust
impl Rectangle {
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }
}
```

回傳 type 和 function body 中的 `Self` 關鍵字是 `impl` 關鍵字後面出現的 type 的 alias，在這個例子中就是 `Rectangle`。

要呼叫這個 associated function，我們使用 `::` 語法與 struct 名稱一起；`let sq = Rectangle::square(3);` 就是一個範例。這個 function 由 struct 進行 namespaced：`::` 語法用於 associated functions 和由 modules 建立的 namespaces。我們將在第七章討論 modules。

### 多個 impl Blocks

每個 struct 都允許有多個 `impl` blocks。舉例來說，Listing 5-15 等同於 Listing 5-16 中所示的程式碼，其中每個 method 都位於其自己的 `impl` block 中。

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

Listing 5-16: 使用多個 `impl` blocks 重寫 Listing 5-15

在這裡將這些 methods 分離到多個 `impl` blocks 中沒有任何理由，但這是有效的語法。我們將在第十章看到多個 `impl` blocks 有用的情況，屆時我們將討論 generic types 和 traits。

## 總結

Structs 讓你能夠建立對你的 domain 具有意義的 custom types。透過使用 structs，你可以讓相關的資料片段彼此連結，並為每個片段命名以使你的程式碼更清晰。在 `impl` blocks 中，你可以定義與你的 type 相關聯的 functions，而 methods 是一種 associated function，讓你能夠指定 struct 實例所具有的行為。

但 struct 並不是你建立 custom types 的唯一方式：讓我們轉向 Rust 的 enum 功能，為你的工具箱再添加一個工具。
