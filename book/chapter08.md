[目錄]

# 常見的 Collections

Rust 的 `standard library` 包含許多非常有用的 `data structures`，稱之為 _`collections`_。大多數其他 `data types` 代表一個特定值，但 `collections` 可以包含多個值。與內建的 `array` 和 `tuple` 類型不同，這些 `collections` 所指向的 `data` 儲存在 `heap` 上，這意味著 `data` 的數量不需要在 `compile time` 知道，並且可以隨著 `program` 的執行而增長或縮小。每種 `collection` 都有不同的能力和成本，選擇適合您當前情況的 `collection` 是一項您會隨著時間發展的技能。在本章中，我們將討論在 Rust `program` 中非常常用到的三種 `collections`：

- _`vector`_ 允許您將可變數量的值彼此相鄰地儲存。
- _`string`_ 是一種字元 `collection`。我們之前提過 `String` `type`，但在本章中，我們將深入討論它。
- _`hash map`_ 允許您將值與特定 `key` 關聯起來。它是更一般 `data structure` _`map`_ 的一個特定實作。

要了解 `standard library` 提供的其他類型 `collections`，請參閱 _[https://doc.rust-lang.org/book/std/collections/index.html](https://doc.rust-lang.org/book/std/collections/index.html)_ 的文件。

我們將討論如何建立和更新 `vectors`、`strings` 和 `hash maps`，以及它們各自的特殊之處。

## 使用 Vectors 儲存值列表

我們將要看的第一個 `collection type` 是 `Vec<T>`，也稱為 _`vector`_。`Vectors` 允許您在單一 `data structure` 中儲存多個值，這些值在 `memory` 中彼此相鄰。`Vectors` 只能儲存相同類型的值。當您有一系列項目時，例如檔案中的文字行或購物車中的商品價格，它們非常有用。

### 建立一個新的 Vector

要建立一個新的空 `vector`，我們呼叫 `Vec::new` `function`，如 Listing 8-1 所示。

```rust
let v: Vec<i32> = Vec::new();
```

Listing 8-1：建立一個新的空 `vector` 來儲存 `i32` 類型的值

請注意，我們在這裡添加了一個 `type annotation`。因為我們沒有向這個 `vector` 中插入任何值，Rust 不知道我們打算儲存什麼類型的 `elements`。這是一個重要的點。`Vectors` 是使用 `generics` 實作的；我們將在 Chapter 10 中介紹如何在您自己的類型中使用 `generics`。目前，請知道 `standard library` 提供的 `Vec<T>` `type` 可以儲存任何 `type`。當我們建立一個 `vector` 來儲存特定 `type` 時，我們可以在尖括號內指定 `type`。在 Listing 8-1 中，我們已經告訴 Rust，`v` 中的 `Vec<T>` 將儲存 `i32` `type` 的 `elements`。

更常見的情況是，您會使用初始值建立 `Vec<T>`，Rust 會推斷您要儲存的值的 `type`，因此您很少需要進行這種 `type annotation`。Rust 方便地提供了 `vec!` `macro`，它將建立一個包含您給定值的新 `vector`。Listing 8-2 建立了一個新的 `Vec<i32>`，它包含值 `1`、`2` 和 `3`。整數 `type` 是 `i32`，因為這是預設的整數 `type`，我們在 Chapter 3 的「Data Types」部分討論過。

```rust
let v = vec![1, 2, 3];
```

Listing 8-2：建立一個包含值的新 `vector`

因為我們給定了初始的 `i32` 值，Rust 可以推斷 `v` 的 `type` 是 `Vec<i32>`，並且 `type annotation` 不是必需的。接下來，我們將看看如何修改 `vector`。

### 更新 Vector

要建立一個 `vector` 然後向其中添加 `elements`，我們可以使用 `push` `method`，如 Listing 8-3 所示。

```rust
    let mut v = Vec::new();

    v.push(5);
    v.push(6);
    v.push(7);
    v.push(8);
```

Listing 8-3：使用 `push` `method` 將值添加到 `vector`

與任何 `variable` 一樣，如果我們想能夠更改其值，我們需要使用 `mut` `keyword` 將其設為 `mutable`，如 Chapter 3 中所討論的。我們放入其中的數字都是 `i32` `type`，Rust 從 `data` 中推斷出這一點，因此我們不需要 `Vec<i32>` `annotation`。

### 讀取 Vector 的 Elements

有兩種方法可以參考儲存在 `vector` 中的值：透過 `indexing` 或使用 `get` `method`。在以下範例中，我們已標註從這些 `functions` 返回的值的 `types`，以增加清晰度。

Listing 8-4 顯示了在 `vector` 中存取值的兩種方法，使用 `indexing` `syntax` 和 `get` `method`。

```rust
    let v = vec![1, 2, 3, 4, 5];

    let third: &i32 = &v[2];
    println!("The third element is {third}");

    let third: Option<&i32> = v.get(2);
    match third {
        Some(third) => println!("The third element is {third}"),
        None => println!("There is no third element."),
    }
```

Listing 8-4：使用 `indexing` `syntax` 和 `get` `method` 存取 `vector` 中的項目

請注意這裡的一些細節。我們使用 `index` 值 `2` 來取得第三個 `element`，因為 `vectors` 是根據數字來 `index` 的，從零開始。使用 `&` 和 `[]` 會給我們一個指向該 `index` 值的 `element` 的 `reference`。當我們使用 `get` `method` 並將 `index` 作為參數傳入時，我們會得到一個 `Option<&T>`，我們可以將其與 `match` 一起使用。

Rust 提供了這兩種 `reference` `element` 的方式，因此您可以選擇當您嘗試使用超出現有 `elements` 範圍的 `index` 值時 `program` 的行為方式。例如，讓我們看看當我們有一個包含五個 `elements` 的 `vector`，然後我們嘗試使用每種技術存取 `index` 為 100 的 `element` 時會發生什麼，如 Listing 8-5 所示。

```rust
    let v = vec![1, 2, 3, 4, 5];

    let does_not_exist = &v[100];
    let does_not_exist = v.get(100);
```

Listing 8-5：嘗試存取包含五個 `elements` 的 `vector` 中 `index` 為 100 的 `element`

當我們執行這段程式碼時，第一個 `[]` `method` 將導致 `program` `panic`，因為它 `references` 到一個不存在的 `element`。當您希望 `program` 在嘗試存取超出 `vector` 尾部的 `element` 時崩潰時，最好使用此 `method`。

當 `get` `method` 傳入的 `index` 超出 `vector` 範圍時，它會返回 `None` 而不會 `panicking`。如果存取超出 `vector` 範圍的 `element` 在正常情況下可能偶爾發生，您將使用此 `method`。然後您的程式碼將有邏輯來處理 `Some(&element)` 或 `None`，如 Chapter 6 中所討論的。例如，`index` 可能來自於使用者輸入的數字。如果他們不小心輸入了一個過大的數字並且 `program` 得到了一個 `None` 值，您可以告訴使用者當前 `vector` 中有多少個項目，並給他們另一次機會輸入一個有效值。這會比因打字錯誤而導致 `program` 崩潰更具使用者友善性！

當 `program` 有一個有效的 `reference` 時，`borrow checker` 會強制執行 `ownership` 和 `borrowing rules` (在 Chapter 4 中介紹)，以確保此 `reference` 和對 `vector` 內容的任何其他 `references` 保持有效。回想一下該規則，即您不能在同一個 `scope` 中同時擁有 `mutable` 和 `immutable references`。該規則適用於 Listing 8-6，其中我們持有 `vector` 中第一個 `element` 的 `immutable reference`，並嘗試在 `vector` 末尾添加一個 `element`。如果我們稍後在 `function` 中嘗試引用該 `element`，則此 `program` 將無法工作。

```rust
    let mut v = vec![1, 2, 3, 4, 5];

    let first = &v[0];

    v.push(6);

    println!("The first element is: {first}");
```

Listing 8-6：嘗試在持有項目 `reference` 的同時向 `vector` 添加一個 `element`

編譯這段程式碼將導致以下錯誤：

```
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:5
  |
4 |     let first = &v[0];
  |                  - immutable borrow occurs here
5 |
6 |     v.push(6);
  |     ^^^^^^^^^ mutable borrow occurs here
7 |
8 |     println!("The first element is: {first}");
  |                                     ------- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `collections` (bin "collections") due to 1 previous error
```

Listing 8-6 中的程式碼看起來應該可以工作：為什麼指向第一個 `element` 的 `reference` 會關心 `vector` 末尾的變化？這個錯誤是由於 `vectors` 的工作方式：因為 `vectors` 將值在 `memory` 中彼此相鄰放置，如果 `vector` 當前儲存的地方沒有足夠的空間將所有 `elements` 彼此相鄰放置，那麼在 `vector` 的末尾添加一個新 `element` 可能需要分配新的 `memory` 並將舊的 `elements` 複製到新的空間。在這種情況下，指向第一個 `element` 的 `reference` 將指向已解除分配的 `memory`。`borrowing rules` 防止 `programs` 陷入這種情況。

> Note: 有關 `Vec<T>` `type` 的實作細節，請參閱 _[https://doc.rust-lang.org/book/nomicon/vec/vec.html](https://doc.rust-lang.org/book/nomicon/vec/vec.html)_ 的「The Rustonomicon」。

### 迭代 Vector 中的值

要依次存取 `vector` 中的每個 `element`，我們會遍歷所有 `elements`，而不是一次一個地使用 `indices` 存取。Listing 8-7 顯示了如何使用 `for` `loop` 來取得 `i32` 值的 `vector` 中每個 `element` 的 `immutable references` 並列印它們。

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{i}");
}
```

Listing 8-7：透過使用 `for` `loop` 迭代 `elements` 來列印 `vector` 中的每個 `element`

我們還可以迭代 `mutable vector` 中每個 `element` 的 `mutable references`，以便更改所有 `elements`。Listing 8-8 中的 `for` `loop` 將為每個 `element` 加上 `50`。

```rust
let mut v = vec![100, 32, 57];
for i in &mut v {
    *i += 50;
}
```

Listing 8-8：迭代 `vector` 中 `elements` 的 `mutable references`

要更改 `mutable reference` 所指向的值，我們必須使用 `*` `dereference operator` 才能在我們使用 `+=` `operator` 之前取得 `i` 中的值。我們將在 Chapter 15 的「Following the Reference to the Value」部分中進一步討論 `dereference operator`。

迭代 `vector`，無論是 `immutably` 還是 `mutably`，都是安全的，因為 `borrow checker` 的規則。如果我們嘗試在 Listing 8-7 和 Listing 8-8 中的 `for` `loop` 主體中插入或移除項目，我們將會得到一個類似於 Listing 8-6 中程式碼所得到的 `compiler error`。`for` `loop` 持有的 `vector` 的 `reference` 防止了整個 `vector` 的同時修改。

### 使用 Enum 儲存多種類型

`Vectors` 只能儲存相同 `type` 的值。這可能很不方便；確實有需要儲存不同 `type` 項目列表的 `use cases`。幸運的是，`enum` 的 `variants` 定義在相同的 `enum` `type` 下，因此當我們需要一個 `type` 來表示不同 `types` 的 `elements` 時，我們可以定義並使用 `enum`！

例如，假設我們想從試算表中的一行獲取值，其中行中的某些欄位包含 `integers`，某些包含 `floating-point numbers`，以及某些包含 `strings`。我們可以定義一個 `enum`，其 `variants` 將持有不同的 `value types`，並且所有 `enum` `variants` 都將被視為相同的 `type`：即該 `enum` 的 `type`。然後我們可以建立一個 `vector` 來持有該 `enum`，這樣最終就可以持有不同的 `types`。我們在 Listing 8-9 中展示了這一點。

```rust
    enum SpreadsheetCell {
        Int(i32),
        Float(f64),
        Text(String),
    }

    let row = vec![
        SpreadsheetCell::Int(3),
        SpreadsheetCell::Text(String::from("blue")),
        SpreadsheetCell::Float(10.12),
    ];
```

Listing 8-9：定義一個 `enum` 以將不同 `types` 的值儲存在一個 `vector` 中

Rust 需要在 `compile time` 知道 `vector` 中將會有哪些 `types`，這樣它才能確切知道在 `heap` 上儲存每個 `element` 需要多少 `memory`。我們也必須明確指定此 `vector` 中允許哪些 `types`。如果 Rust 允許 `vector` 包含任何 `type`，那麼其中一種或多種 `types` 可能會導致對 `vector` `elements` 執行操作時出錯。使用 `enum` 加上 `match` `expression` 意味著 Rust 將在 `compile time` 確保處理了所有可能的情況，如 Chapter 6 中所討論的。

如果您不知道 `program` 在 `runtime` 將會取得哪些 `types` 的窮舉集合來儲存在 `vector` 中，那麼 `enum` 技術將不起作用。相反，您可以使用 `trait object`，我們將在 Chapter 18 中介紹。

現在我們已經討論了一些使用 `vectors` 的最常見方式，請務必查閱 `standard library` 在 `Vec<T>` 上定義的許多有用 `methods` 的 `API documentation`。例如，除了 `push` 之外，`pop` `method` 會移除並返回最後一個 `element`。

### 丟棄 Vector 會丟棄其 Elements

像任何其他 `struct` 一樣，`vector` 在超出 `scope` 時會被釋放，如 Listing 8-10 中所標註的。

```rust
    {
        let v = vec![1, 2, 3, 4];

        // do stuff with v
    } // <- v goes out of scope and is freed here
```

Listing 8-10：顯示 `vector` 及其 `elements` 在何處被丟棄

當 `vector` 被丟棄時，其所有內容也會被丟棄，這意味著它所持有的 `integers` 將被清理。`borrow checker` 確保對 `vector` 內容的任何 `references` 僅在 `vector` 本身有效時才使用。

讓我們繼續下一個 `collection type`：`String`！

## 使用 Strings 儲存 UTF-8 編碼文字

我們在 Chapter 4 討論過 `strings`，但現在我們將更深入地探討它們。新的 Rustacean 通常會因為三個原因而卡在 `strings` 上：Rust 傾向於暴露可能的錯誤，`strings` 比許多 `programmers` 認為的更複雜的 `data structure`，以及 `UTF-8`。當您來自其他 `programming languages` 時，這些因素以一種看似困難的方式結合在一起。

我們在 `collections` 的上下文中討論 `strings`，因為 `strings` 是作為 `bytes` 的 `collection` 實作的，加上一些 `methods`，當這些 `bytes` 被解釋為文字時，可以提供有用的功能。在本節中，我們將討論每個 `collection type` 都有的 `String` 操作，例如建立、更新和讀取。我們還將討論 `String` 與其他 `collections` 的不同之處，即 `indexing` `String` 如何因人們和電腦解釋 `String` `data` 的方式差異而變得複雜。

### 什麼是 String？

我們首先定義術語 _`string`_ 的含義。Rust 的核心語言中只有一種 `string type`，即 `string slice` `str`，它通常以其 `borrowed form` `&str` 呈現。在 Chapter 4 中，我們討論了 _`string slices`_，它們是 `references` 到儲存在其他地方的 `UTF-8` 編碼 `string data`。例如，`String literals` 儲存在 `program’s binary` 中，因此它們是 `string slices`。

`String` `type` 由 Rust 的 `standard library` 提供，而不是編寫到核心語言中，它是一種可增長、`mutable`、`owned` 的 `UTF-8` `encoded string type`。當 Rustacean 在 Rust 中提到「`strings`」時，他們可能指的是 `String` 或 `string slice` `&str` `types`，而不僅僅是其中一種 `type`。儘管本節主要關於 `String`，但在 Rust 的 `standard library` 中這兩種 `types` 都被大量使用，而且 `String` 和 `string slices` 都是 `UTF-8` 編碼的。

### 建立一個新的 String

許多 `Vec<T>` 可用的操作在 `String` 中也可用，因為 `String` 實際上是作為 `bytes` `vector` 的 `wrapper` 實作的，並帶有一些額外的保證、限制和功能。一個與 `Vec<T>` 和 `String` 以相同方式工作的 `function` 範例是 `new` `function`，用於建立一個實例，如 Listing 8-11 所示。

```rust
let mut s = String::new();
```

Listing 8-11：建立一個新的空 `String`

這行程式碼建立了一個名為 `s` 的新的空 `string`，然後我們可以將 `data` 加載到其中。通常，我們會有初始化 `data`，我們希望用它來開始 `string`。為此，我們使用 `to_string` `method`，它適用於任何實作 `Display` `trait` 的 `type`，就像 `string literals` 一樣。Listing 8-12 顯示了兩個範例。

```rust
    let data = "initial contents";

    let s = data.to_string();

    // The method also works on a literal directly:
    let s = "initial contents".to_string();
```

Listing 8-12：使用 `to_string` `method` 從 `string literal` 建立一個 `String`

這段程式碼建立了一個包含 `initial contents` 的 `string`。

我們也可以使用 `String::from` `function` 從 `string literal` 建立 `String`。Listing 8-13 中的程式碼與 Listing 8-12 中使用 `to_string` 的程式碼等效。

```rust
let s = String::from("initial contents");
```

Listing 8-13：使用 `String::from` `function` 從 `string literal` 建立 `String`

因為 `strings` 用於許多不同的事物，我們可以為 `strings` 使用許多不同的 `generic APIs`，為我們提供了許多選擇。其中一些可能看起來是多餘的，但它們都有自己的作用！在這種情況下，`String::from` 和 `to_string` 執行相同的操作，因此您選擇哪一個取決於 `style` 和可讀性。

請記住 `strings` 是 `UTF-8` 編碼的，因此我們可以包含任何正確編碼的 `data` 在其中，如 Listing 8-14 所示。

```rust
let hello = String::from("السلام عليكم");
let hello = String::from("Dobrý den");
let hello = String::from("Hello");
let hello = String::from("שלום");
let hello = String::from("नमस्ते");
let hello = String::from("こんにちは");
let hello = String::from("안녕하세요");
let hello = String::from("你好");
let hello = String::from("Olá");
let hello = String::from("Здравствуйте");
let hello = String::from("Hola");
```

Listing 8-14：將不同語言的問候語儲存在 `strings` 中

所有這些都是有效的 `String` `values`。

### 更新 String

如果您向 `String` 中推入更多 `data`，它的 `size` 和內容可以增長和改變，就像 `Vec<T>` 的內容一樣。此外，您可以方便地使用 `+` `operator` 或 `format!` `macro` 來連接 `String` `values`。

#### 使用 push_str 和 push 向 String 追加

我們可以使用 `push_str` `method` 追加 `string slice` 來增長 `String`，如 Listing 8-15 所示。

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

Listing 8-15：使用 `push_str` `method` 將 `string slice` 追加到 `String`

在這兩行之後，`s` 將包含 `foobar`。`push_str` `method` 接受一個 `string slice`，因為我們不一定想取得參數的 `ownership`。例如，在 Listing 8-16 的程式碼中，我們希望在將 `s2` 的內容追加到 `s1` 之後，仍能使用 `s2`。

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
println!("s2 is {s2}");
```

Listing 8-16：在將 `string slice` 的內容追加到 `String` 後使用它

如果 `push_str` `method` 取得了 `s2` 的 `ownership`，我們將無法在最後一行列印其值。然而，這段程式碼卻如我們預期地工作！

`push` `method` 接受單個 `character` 作為參數並將其添加到 `String`。Listing 8-17 使用 `push` `method` 將字母 _l_ 添加到 `String`。

```rust
let mut s = String::from("lo");
s.push('l');
```

Listing 8-17：使用 `push` 將一個 `character` 添加到 `String` 值

結果，`s` 將包含 `lol`。

#### 使用 + Operator 或 format! Macro 進行連接

通常，您會想組合兩個現有的 `strings`。一種方法是使用 `+` `operator`，如 Listing 8-18 所示。

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // note s1 has been moved here and can no longer be used
```

Listing 8-18：使用 `+` `operator` 將兩個 `String` 值組合成一個新的 `String` 值

`string` `s3` 將包含 `Hello, world!`。`s1` 在加法運算後不再有效的原因，以及我們使用 `s2` 的 `reference` 的原因，與我們使用 `+` `operator` 時呼叫的 `method` 的 `signature` 有關。`+` `operator` 使用 `add` `method`，其 `signature` 如下所示：

```rust
fn add(self, s: &str) -> String {
```

在 `standard library` 中，您會看到使用 `generics` 和 `associated types` 定義的 `add`。在這裡，我們替換了具體的 `concrete types`，這就是我們使用 `String` `values` 呼叫此 `method` 時發生的情況。我們將在 Chapter 10 討論 `generics`。這個 `signature` 提供了我們理解 `+` `operator` 棘手部分所需的線索。

首先，`s2` 有一個 `&`，這表示我們正在將第二個 `string` 的 _`reference`_ 添加到第一個 `string`。這是因為 `add` `function` 中的 `s` 參數：我們只能將 `&str` 添加到 `String`；我們不能將兩個 `String` `values` 添加在一起。但是等等——`&s2` 的 `type` 是 `&String`，而不是 `&str`，這在 `add` 的第二個參數中指定。那麼為什麼 Listing 8-18 會編譯成功呢？

我們能夠在呼叫 `add` 時使用 `&s2` 的原因是 `compiler` 可以將 `&String` 參數 _`coerce`_ 為 `&str`。當我們呼叫 `add` `method` 時，Rust 使用 _`deref coercion`_，它會將 `&s2` 轉換為 `&s2[..]`。我們將在 Chapter 15 更深入地討論 `deref coercion`。因為 `add` 不會取得 `s` 參數的 `ownership`，所以在這個操作之後 `s2` 仍然是一個有效的 `String`。

其次，我們可以在 `signature` 中看到 `add` 會取得 `self` 的 `ownership`，因為 `self` _沒有_ `&`。這意味著 Listing 8-18 中的 `s1` 將被移入 `add` 呼叫中，並且在此之後將不再有效。因此，儘管 `let s3 = s1 + &s2;` 看起來會複製兩個 `strings` 並建立一個新的，但此語句實際上是取得 `s1` 的 `ownership`，追加 `s2` 內容的副本，然後返回結果的 `ownership`。換句話說，它看起來像是進行了大量的複製，但實際上並沒有；其 `implementation` 比複製更有效率。

如果我們需要連接多個 `strings`，`+` `operator` 的行為會變得難以控制：

```rust
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toe");

    let s = s1 + "-" + &s2 + "-" + &s3;
```

此時，`s` 將會是 `tic-tac-toe`。有了這麼多的 `+` 和 `"` `characters`，很難看清正在發生什麼。對於更複雜的 `strings` 組合方式，我們可以改用 `format!` `macro`：

```rust
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toe");

    let s = format!("{s1}-{s2}-{s3}");
```

這段程式碼也將 `s` 設為 `tic-tac-toe`。`format!` `macro` 的工作方式類似於 `println!`，但它不是將輸出列印到螢幕，而是返回一個包含內容的 `String`。使用 `format!` 的程式碼版本更容易閱讀，並且由 `format!` `macro` 生成的程式碼使用 `references`，因此此呼叫不會取得任何參數的 `ownership`。

### 對 Strings 進行索引

在許多其他 `programming languages` 中，透過 `index` 引用來存取 `string` 中的單個 `characters` 是一種有效且常見的操作。然而，如果您嘗試在 Rust 中使用 `indexing` `syntax` 存取 `String` 的部分，您將會得到一個錯誤。考慮 Listing 8-19 中的無效程式碼。

```rust
let s1 = String::from("hi");
let h = s1[0];
```

Listing 8-19：嘗試對 `String` 使用 `indexing` `syntax`

這段程式碼將導致以下錯誤：

```
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0277]: the type `str` cannot be indexed by `{integer}`
 --> src/main.rs:3:16
  |
3 |     let h = s1[0];
  |                ^ string indices are ranges of `usize`
  |
  = note: you can use `.chars().nth()` or `.bytes().nth()`
          for more information, see chapter 8 in The Book: <https://doc.rust-lang.org/book/ch08-02-strings.html#indexing-into-strings>
  = help: the trait `SliceIndex<str>` is not implemented for `{integer}`
          but trait `SliceIndex<[_]>` is implemented for `usize`
  = help: for that trait implementation, expected `[_]`, found `str`
  = note: required for `String` to implement `Index<{integer}>`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `collections` (bin "collections") due to 1 previous error
```

錯誤和註解說明了一切：Rust `strings` 不支援 `indexing`。但為什麼不支援呢？要回答這個問題，我們需要討論 Rust 如何在 `memory` 中儲存 `strings`。

#### 內部表示

`String` 是 `Vec<u8>` 的 `wrapper`。讓我們看看 Listing 8-14 中一些正確編碼的 `UTF-8` 範例 `strings`。首先，這個：

```rust
let hello = String::from("Hola");
```

在這種情況下，`len` 將是 `4`，這意味著儲存 `string` `"Hola"` 的 `vector` 長度為 4 `bytes`。這些字母中的每一個在 `UTF-8` 編碼時佔用一個 `byte`。然而，下面這行可能會讓您驚訝（請注意，這個 `string` 以西里爾大寫字母 _Ze_ 開頭，而不是數字 3）：

```rust
let hello = String::from("Здравствуйте");
```

如果問您 `string` 的長度是多少，您可能會說 12。事實上，Rust 的答案是 24：這是在 `UTF-8` 中編碼「Здравствуйте」所需的 `bytes` 數量，因為該 `string` 中的每個 `Unicode scalar value` 需要 2 `bytes` 的儲存空間。因此，對 `string` 的 `bytes` 進行 `index` 不會總是與有效的 `Unicode scalar value` 相關聯。為了演示，考慮這個無效的 Rust 程式碼：

```rust
let hello = "Здравствуйте";
let answer = &hello[0];
```

您已經知道 `answer` 不會是 `З`，第一個字母。當在 `UTF-8` 中編碼時，`З` 的第一個 `byte` 是 `208`，第二個是 `151`，所以看起來 `answer` 實際上應該是 `208`，但 `208` 本身不是一個有效的 `character`。如果使用者詢問此 `string` 的第一個字母，返回 `208` 很可能不是他們想要的；然而，這是 Rust 在 `byte` `index` 0 處擁有的唯一 `data`。使用者通常不希望返回 `byte` 值，即使 `string` 只包含拉丁字母：如果 `&"hi"[0]` 是返回 `byte` 值的有效程式碼，它將返回 `104`，而不是 `h`。

因此，答案是，為了避免返回意外值並導致可能不會立即發現的 `bugs`，Rust 根本不 `compile` 這段程式碼，並在開發過程的早期防止誤解。

#### Bytes、Scalar Values 和 Grapheme Clusters！我的天啊！

關於 `UTF-8` 的另一個重點是，從 Rust 的角度來看 `strings` 實際上可以透過三種相關方式來檢視：作為 `bytes`、`scalar values` 和 `grapheme clusters`（最接近我們所謂的 _`letters`_）。

如果我們看一下用天城體文字書寫的印地語單詞「नमस्ते」，它以 `u8` `values` 的 `vector` 儲存，看起來像這樣：

```
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164,
224, 165, 135]
```

那是 18 `bytes`，也是電腦最終儲存這些 `data` 的方式。如果我們將它們視為 `Unicode scalar values`（即 Rust 的 `char` `type`），那些 `bytes` 看起來像這樣：

```
['न', 'म', 'स', '्', 'त', 'े']
```

這裡有六個 `char` `values`，但第四個和第六個不是 `letters`：它們是獨立時沒有意義的附加符號。最後，如果我們將它們視為 `grapheme clusters`，我們會得到一個人會稱之為構成印地語單詞的四個 `letters`：

```
["न", "म", "स्", "ते"]
```

Rust 提供了不同方式來解釋電腦儲存的原始 `string data`，以便每個 `program` 都可以選擇其所需的解釋，無論 `data` 是何種人類語言。

Rust 不允許我們對 `String` 進行 `index` 以獲取 `character` 的最後一個原因是，`indexing` 操作預期總是需要 `constant time (O(1))`。但對於 `String`，無法保證這種 `performance`，因為 Rust 必須從頭到 `index` 遍歷內容，以確定有多少個有效的 `characters`。

### 字串切片

對 `string` 進行 `indexing` 通常不是一個好主意，因為 `string-indexing` 操作的 `return type` 不清楚應該是什麼：`byte value`、`character`、`grapheme cluster` 還是 `string slice`。因此，如果您確實需要使用 `indices` 來建立 `string slices`，Rust 會要求您更具體。

您可以使用帶有 `range` 的 `[]` 來建立包含特定 `bytes` 的 `string slice`，而不是使用單個數字的 `[]` 進行 `indexing`：

```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

在這裡，`s` 將是一個 `&str`，其中包含 `string` 的前四個 `bytes`。之前我們提到這些 `characters` 中的每一個都是兩個 `bytes`，這意味著 `s` 將是 `Зд`。

如果我們嘗試只切片 `character` 的部分 `bytes`，例如 `&hello[0..1]`，Rust 會在 `runtime` `panic`，就像 `vector` 中存取無效 `index` 一樣：

```
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/collections`

thread 'main' panicked at src/main.rs:4:19:
byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2) of `Здравствуйте`
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

使用 `ranges` 建立 `string slices` 時應小心，因為這樣做可能會使您的 `program` 崩潰。

### 迭代 Strings 的方法

操作 `strings` 片段的最佳方法是明確說明您想要 `characters` 還是 `bytes`。對於單個 `Unicode scalar values`，請使用 `chars` `method`。在「Зд」上呼叫 `chars` 會將其分開並返回兩個 `char` `type` 的值，您可以遍歷結果以存取每個 `element`：

```rust
for c in "Зд".chars() {
    println!("{c}");
}
```

這段程式碼將列印以下內容：

```
З
д
```

或者，`bytes` `method` 會返回每個原始 `byte`，這可能適合您的 `domain`：

```rust
for b in "Зд".bytes() {
    println!("{b}");
}
```

這段程式碼將列印構成此 `string` 的四個 `bytes`：

```
208
151
208
180
```

但請務必記住，有效的 `Unicode scalar values` 可能由多個 `byte` 組成。

從 `strings` 中獲取 `grapheme clusters`，就像天城體文字一樣，是複雜的，因此 `standard library` 不提供此功能。如果這是您需要的功能，`crates.io` 上有可用的 `Crates`。

### Strings 並不那麼簡單

總之，`strings` 是複雜的。不同的 `programming languages` 在如何向 `programmer` 呈現這種複雜性方面做出不同的選擇。Rust 選擇將 `String` `data` 的正確處理作為所有 Rust `programs` 的預設行為，這意味著 `programmers` 必須預先更多地考慮處理 `UTF-8` `data`。這種權衡暴露了比其他 `programming languages` 更明顯的 `strings` 複雜性，但它避免了您在開發生命週期後期處理涉及非 `ASCII characters` 的錯誤。

好消息是，`standard library` 提供了許多基於 `String` 和 `&str` `types` 的功能，以幫助正確處理這些複雜情況。請務必查看文件，了解有用的 `methods`，例如用於在 `string` 中搜尋的 `contains`，以及用於將 `string` 的部分替換為另一個 `string` 的 `replace`。

讓我們轉向一些稍微不那麼複雜的東西：`hash maps`！

## 在 Hash Maps 中儲存具有關聯值的 Keys

我們常見的 `collections` 中最後一個是 _`hash map`_。`type` `HashMap<K, V>` 使用 _`hashing function`_ 儲存 `type K` 的 `keys` 到 `type V` 的 `values` 的映射，它決定了如何將這些 `keys` 和 `values` 放置到 `memory` 中。許多 `programming languages` 都支援這類 `data structure`，但它們通常使用不同的名稱，例如 _`hash`_、_`map`_、_`object`_、_`hash table`_、_`dictionary`_ 或 _`associative array`_ 等等。

`Hash maps` 在您不使用 `index`（像 `vectors` 那樣）而是使用任何 `type` 的 `key` 來查詢 `data` 時非常有用。例如，在遊戲中，您可以在 `hash map` 中追蹤每個團隊的分數，其中每個 `key` 是團隊的名稱，`values` 是每個團隊的分數。給定團隊名稱，您可以檢索其分數。

我們將在本節中介紹 `hash maps` 的基本 `API`，但 `standard library` 在 `HashMap<K, V>` 上定義的 `functions` 中還隱藏著許多好東西。一如既往，請查閱 `standard library documentation` 以獲取更多資訊。

### 建立一個新的 Hash Map

建立空 `hash map` 的一種方法是使用 `new` 並使用 `insert` 添加 `elements`。在 Listing 8-20 中，我們正在追蹤兩個隊伍（_Blue_ 和 _Yellow_）的分數。Blue 隊以 10 分開始，Yellow 隊以 50 分開始。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
```

Listing 8-20：建立一個新的 `hash map` 並插入一些 `keys` 和 `values`

請注意，我們需要首先 `use` `standard library` 的 `collections` 部分中的 `HashMap`。在我們三種常見的 `collections` 中，這種 `collection` 最不常用，因此它不包含在 `prelude` 中自動引入 `scope` 的功能中。`Hash maps` 也較少得到 `standard library` 的支援；例如，沒有內建的 `macro` 來建構它們。

就像 `vectors` 一樣，`hash maps` 將它們的 `data` 儲存在 `heap` 上。這個 `HashMap` 的 `keys` `type` 為 `String`，`values` `type` 為 `i32`。像 `vectors` 一樣，`hash maps` 是同質的：所有 `keys` 都必須是相同的 `type`，所有 `values` 也都必須是相同的 `type`。

### 存取 Hash Map 中的 Values

我們可以透過向 `get` `method` 提供 `key` 來從 `hash map` 中取得 `value`，如 Listing 8-21 所示。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    let team_name = String::from("Blue");
    let score = scores.get(&team_name).copied().unwrap_or(0);
```

Listing 8-21：存取儲存在 `hash map` 中的 Blue 隊分數

在這裡，`score` 將具有與 Blue 隊相關聯的 `value`，結果將是 `10`。`get` `method` 返回一個 `Option<&V>`；如果 `hash map` 中沒有該 `key` 的 `value`，`get` 將返回 `None`。這個 `program` 透過呼叫 `copied` 來處理 `Option`，以獲得 `Option<i32>` 而不是 `Option<&i32>`，然後使用 `unwrap_or` 將 `score` 設置為零，如果 `scores` 沒有該 `key` 的項目。

我們可以像處理 `vectors` 一樣，使用 `for` `loop` 以類似的方式迭代 `hash map` 中的每個 `key-value pair`：

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    for (key, value) in &scores {
        println!("{key}: {value}");
    }
```

這段程式碼將以任意順序列印每個 `pair`：

```
Yellow: 50
Blue: 10
```

### Hash Maps 和 Ownership

對於實作 `Copy` `trait` 的 `types`，例如 `i32`，`values` 會被複製到 `hash map` 中。對於像 `String` 這樣的 `owned values`，`values` 會被移動，並且 `hash map` 將成為這些 `values` 的 `owner`，如 Listing 8-22 所示。

```rust
    use std::collections::HashMap;

    let field_name = String::from("Favorite color");
    let field_value = String::from("Blue");

    let mut map = HashMap::new();
    map.insert(field_name, field_value);
    // field_name and field_value are invalid at this point, try using them and
    // see what compiler error you get!
```

Listing 8-22：顯示 `keys` 和 `values` 一旦插入，便由 `hash map` `owned`

在透過呼叫 `insert` 將 `variables` `field_name` 和 `field_value` 移動到 `hash map` 中之後，我們無法再使用它們。

如果我們將 `references` 插入 `hash map` 中的 `values`，則 `values` 將不會被移動到 `hash map` 中。`references` 指向的 `values` 必須至少與 `hash map` 有效期間一樣長。我們將在 Chapter 10 的「Validating References with Lifetimes」中更詳細地討論這些問題。

### 更新 Hash Map

儘管 `key` 和 `value` `pairs` 的數量是可增長的，但每個唯一的 `key` 一次只能有一個 `value` 與之關聯（但反之則不然：例如，Blue 隊和 Yellow 隊都可以在 `scores` `hash map` 中儲存 `value` `10`）。

當您想要更改 `hash map` 中的 `data` 時，您必須決定如何處理 `key` 已經有 `value` 被賦值的狀況。您可以將舊的 `value` 替換為新的 `value`，完全不顧舊的 `value`。您可以保留舊的 `value` 並忽略新的 `value`，只有當 `key` _沒有_ 已經有 `value` 時才添加新的 `value`。或者您可以組合舊的 `value` 和新的 `value`。讓我們看看如何執行這些操作！

#### 覆寫 Value

如果我們將一個 `key` 和一個 `value` 插入 `hash map`，然後用不同的 `value` 插入相同的 `key`，則與該 `key` 相關聯的 `value` 將被替換。儘管 Listing 8-23 中的程式碼呼叫了兩次 `insert`，但 `hash map` 將只包含一個 `key-value pair`，因為我們兩次都插入了 Blue 隊 `key` 的 `value`。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Blue"), 25);

    println!("{scores:?}");
```

Listing 8-23：替換用特定 `key` 儲存的 `value`

這段程式碼將列印 `{"Blue": 25}`。原始的 `value` `10` 已被覆寫。

<a id="only-inserting-a-value-if-the-key-has-no-value"></a>

#### 僅在 Key 不存在時才添加 Key 和 Value

檢查 `hash map` 中是否已存在特定 `key` 與 `value` 的情況很常見，然後採取以下行動：如果 `key` 確實存在於 `hash map` 中，現有的 `value` 應保持不變；如果 `key` 不存在，則插入該 `key` 及其 `value`。

`Hash maps` 有一個特殊的 `API` 稱為 `entry`，它接受您想要檢查的 `key` 作為參數。`entry` `method` 的 `return value` 是一個稱為 `Entry` 的 `enum`，它表示一個可能存在或不存在的 `value`。假設我們想檢查 Yellow 隊的 `key` 是否有與之相關聯的 `value`。如果沒有，我們想插入 `value` `50`，Blue 隊也一樣。使用 `entry` `API`，程式碼看起來像 Listing 8-24。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);

    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50);

    println!("{scores:?}");
```

Listing 8-24：使用 `entry` `method` 僅在 `key` 不已有 `value` 時才插入

`Entry` 上的 `or_insert` `method` 被定義為如果對應的 `Entry` `key` 存在，則返回該 `value` 的 `mutable reference`；如果不存在，則將參數作為此 `key` 的新 `value` 插入，並返回新 `value` 的 `mutable reference`。這種技術比我們自己編寫邏輯更簡潔，而且與 `borrow checker` 的互動也更好。

執行 Listing 8-24 中的程式碼將列印 `{"Yellow": 50, "Blue": 10}`。對 `entry` 的第一次呼叫將為 Yellow 隊插入 `key` 和 `value` `50`，因為 Yellow 隊還沒有 `value`。對 `entry` 的第二次呼叫不會改變 `hash map`，因為 Blue 隊已經有 `value` `10`。

#### 根據舊 Value 更新 Value

`hash maps` 的另一個常見 `use case` 是查找 `key` 的 `value`，然後根據舊的 `value` 進行更新。例如，Listing 8-25 顯示了計算每個單詞在某些文字中出現次數的程式碼。我們使用一個以單詞作為 `keys` 的 `hash map`，並遞增 `value` 來追蹤我們看到該單詞的次數。如果這是我們第一次看到一個單詞，我們將首先插入 `value` `0`。

```rust
    use std::collections::HashMap;

    let text = "hello world wonderful world";

    let mut map = HashMap::new();

    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        *count += 1;
    }

    println!("{map:?}");
```

Listing 8-25：使用儲存單詞和計數的 `hash map` 計算單詞出現次數

這段程式碼將列印 `{"world": 2, "hello": 1, "wonderful": 1}`。您可能會看到相同的 `key-value pairs` 以不同的順序列印：回想「Accessing Values in a Hash Map」中提到，迭代 `hash map` 是以任意順序發生的。

`split_whitespace` `method` 返回一個 `iterator`，它會將 `text` 中的 `value` 分割成由空白字元分隔的 `subslices`。`or_insert` `method` 返回指定 `key` 的 `value` 的 `mutable reference` (`&mut V`)。在這裡，我們將該 `mutable reference` 儲存在 `count` `variable` 中，因此為了給該 `value` 賦值，我們必須首先使用 `asterisk (*)` `dereference` `count`。`mutable reference` 在 `for` `loop` 結束時超出 `scope`，因此所有這些更改都是安全且 `borrowing rules` 允許的。

### 雜湊 Function

預設情況下，`HashMap` 使用一個稱為 _`SipHash`_ 的 `hashing function`，它可以提供對涉及 `hash tables` 的阻斷服務 (DoS) 攻擊的抵抗力[^siphash]<!-- ignore -->。這不是最快的 `hashing algorithm`，但為了更好的安全性而犧牲 `performance` 是值得的。如果您分析您的程式碼並發現預設的 `hash function` 對您的目的來說太慢，您可以透過指定不同的 `hasher` 來切換到另一個 `function`。_`hasher`_ 是一種實作 `BuildHasher` `trait` 的 `type`。我們將在 Chapter 10 中討論 `traits` 以及如何實作它們。您不一定需要從頭開始實作自己的 `hasher`；`crates.io` 上有其他 Rust 使用者分享的 `libraries`，它們提供了實作許多常見 `hashing algorithms` 的 `hashers`。

## 總結

`Vectors`、`strings` 和 `hash maps` 將在您需要儲存、存取和修改 `data` 的 `programs` 中提供大量必要的功能。以下是一些您現在應該具備解決能力的練習：

1. 給定一個 `integers` 列表，使用 `vector` 並返回該列表的 median（排序後，中間位置的 `value`）和 mode（最常出現的 `value`；這裡 `hash map` 會很有幫助）。
1. 將 `strings` 轉換為豬拉丁語。每個單詞的第一個子音會移到單詞的末尾並添加 _ay_，所以 _first_ 變成 _irst-fay_。以母音開頭的單詞則在末尾添加 _hay_（_apple_ 變成 _apple-hay_）。請記住 `UTF-8 encoding` 的細節！
1. 使用 `hash map` 和 `vectors`，建立一個文字介面，允許使用者將員工姓名添加到公司的部門；例如，「將 Sally 添加到 Engineering」或「將 Amir 添加到 Sales」。然後讓使用者按部門或公司部門獲取所有人員列表，按字母順序排序。

`standard library API documentation` 描述了 `vectors`、`strings` 和 `hash maps` 所擁有的 `methods`，這些對於這些練習會很有幫助！

我們正在進入更複雜的 `programs`，其中操作可能會失敗，所以這是討論 `error handling` 的絕佳時機。我們接下來會這麼做！
