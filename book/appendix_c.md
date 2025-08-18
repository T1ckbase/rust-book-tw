[TOC]

## 附錄 C：可派生的 Trait

在本書的許多地方，我們都討論過 `derive` 屬性，你可以將它應用於 struct 或 enum 的定義上。`derive` 屬性會產生程式碼，為你使用 `derive` 語法標注的型別，實作一個帶有預設實作的 trait。

本附錄提供了標準函式庫中所有可與 `derive` 一同使用的 trait 參考。每個章節涵蓋了：

- 派生此 trait 將會啟用哪些運算子和方法
- `derive` 所提供的 trait 實作會做什麼
- 實作此 trait 對於該型別意味著什麼
- 在什麼條件下你被允許或不被允許實作此 trait
- 需要此 trait 的操作範例

如果你想要與 `derive` 屬性所提供的行為不同的行為，請查閱每個 trait 的標準函式庫文件，以了解如何手動實作它們的詳細資訊。

此處列出的 trait 是標準函式庫中唯一定義的、可以使用 `derive` 在你的型別上實作的 trait。標準函式庫中定義的其他 trait 沒有合理的預設行為，因此你需要以對你所要達成的目標有意義的方式來實作它們。

一個無法被派生的 trait 範例是 `Display`，它處理給終端使用者的格式化。你應該總是考慮向終端使用者顯示一個型別的適當方式。終端使用者應該被允許看到型別的哪些部分？他們會覺得哪些部分是相關的？哪種資料格式對他們來說最為相關？Rust 編譯器沒有這種洞察力，所以它無法為你提供適當的預設行為。

本附錄中提供的可派生 trait 清單並非詳盡無遺：函式庫可以為它們自己的 trait 實作 `derive`，這使得你可以使用 `derive` 的 trait 清單是真正開放的。實作 `derive` 涉及使用程序化 macro，這部分內容在第 XX 頁的「Macros」中有所涵蓋。

## 用於程式設計師輸出的 Debug

`Debug` trait 可以在格式化字串中啟用偵錯格式，你可以在 `{}` 預留位置中加入 `:?` 來表示。

`Debug` trait 讓你能夠印出一個型別的實體以供偵錯之用，這樣你和其他使用你的型別的程式設計師就可以在程式執行的某個特定時間點檢查一個實體。

例如，在使用 `assert_eq!` macro 時，`Debug` trait 是必需的。如果相等性斷言失敗，這個 macro 會印出作為參數的實體值，這樣程式設計師就能看到為什麼這兩個實體不相等。

## 用於相等性比較的 PartialEq 與 Eq

`PartialEq` trait 讓你能夠比較一個型別的實體是否相等，並啟用 `==` 與 `!=` 運算子。

派生 `PartialEq` 會實作 `eq` 方法。當在 structs 上派生 `PartialEq` 時，只有當*所有*欄位都相等時，兩個實體才相等；若有任何欄位不相等，則實體不相等。當在 enums 上派生時，每個變體都與自身相等，與其他變體不相等。

例如，在使用 `assert_eq!` macro 時，`PartialEq` trait 是必需的，因為它需要能夠比較兩個型別的實體是否相等。

`Eq` trait 沒有任何方法。它的目的是為了表明，對於被標注的型別的每一個值，該值都與自身相等。`Eq` trait 只能應用於同時實作了 `PartialEq` 的型別，儘管並非所有實作 `PartialEq` 的型別都能實作 `Eq`。其中一個例子是浮點數型別：浮點數的實作規定，兩個非數字（`NaN`）值的實體彼此不相等。

`Eq` 的一個必要使用範例是 `HashMap<K, V>` 中的 key，以便 `HashMap<K, V>` 能夠判斷兩個 key 是否相同。

## 用於排序比較的 PartialOrd 與 Ord

`PartialOrd` trait 讓你能夠為了排序目的而比較一個型別的實體。實作了 `PartialOrd` 的型別可以使用 `<`、`>`、`<=` 和 `>=` 運算子。你只能將 `PartialOrd` trait 應用於同時也實作了 `PartialEq` 的型別。

派生 `PartialOrd` 會實作 `partial_cmp` 方法，該方法會回傳一個 `Option<Ordering>`。當給定的值無法產生一個排序時，它將會是 `None`。一個即使在該型別的大多數值都可以比較的情況下也無法產生排序的值的例子是，非數字（`NaN`）的浮點數值。使用任何浮點數和 `NaN` 浮點數值呼叫 `partial_cmp` 將會回傳 `None`。

當在 structs 上派生時，`PartialOrd` 會按照 struct 定義中欄位出現的順序，比較每個欄位的值來比較兩個實體。當在 enums 上派生時，在 enum 定義中較早宣告的變體會被視為小於較晚列出的變體。

例如，`rand` crate 中的 `gen_range` 方法需要 `PartialOrd` trait，該方法會在由一個範圍運算式指定的範圍內產生一個隨機值。

`Ord` trait 讓你知道對於被標注的型別的任意兩個值，都將存在一個有效的排序。`Ord` trait 實作了 `cmp` 方法，該方法回傳一個 `Ordering` 而不是 `Option<Ordering>`，因為一個有效的排序總是可能的。你只能將 `Ord` trait 應用於同時也實作了 `PartialOrd` 和 `Eq`（而 `Eq` 需要 `PartialEq`）的型別。當在 structs 和 enums 上派生時，`cmp` 的行為與 `PartialOrd` 的派生實作中 `partial_cmp` 的行為相同。

`Ord` 的一個必要使用範例是，當將值儲存在 `BTreeSet<T>` 中時，這是一個根據值的排序順序來儲存資料的資料結構。

## 用於複製值的 Clone 與 Copy

`Clone` trait 讓你能夠明確地建立一個值的深層複製（deep copy），而複製過程可能涉及執行任意程式碼和複製 heap 上的資料。更多關於 `Clone` 的資訊，請參見第 XX 頁的「變數與資料如何與 Clone 互動」。

派生 `Clone` 會實作 `clone` 方法，當為整個型別實作時，它會對型別的每個部分呼叫 `clone`。這意味著型別中的所有欄位或值也必須實作 `Clone` 才能派生 `Clone`。

`Clone` 的一個必要使用範例是，當在一個 slice 上呼叫 `to_vec` 方法時。slice 並不擁有它所包含的型別實體，但 `to_vec` 回傳的 vector 需要擁有它的實體，所以 `to_vec` 會對每個項目呼叫 `clone`。因此，儲存在 slice 中的型別必須實作 `Clone`。

`Copy` trait 讓你能夠僅透過複製儲存在 stack 上的位元來複製一個值；不需要執行任何任意程式碼。更多關於 `Copy` 的資訊，請參見第 XX 頁的「僅限 Stack 的資料：Copy」。

`Copy` trait 沒有定義任何方法，以防止程式設計師重載這些方法並違反「沒有執行任意程式碼」的假設。如此一來，所有程式設計師都可以假設複製一個值將會非常快。

你可以在任何其所有部分都實作了 `Copy` 的型別上派生 `Copy`。一個實作 `Copy` 的型別也必須實作 `Clone`，因為實作 `Copy` 的型別有一個 `Clone` 的簡單實作，其執行的任務與 `Copy` 相同。

`Copy` trait 很少是必需的；實作 `Copy` 的型別有可用的最佳化，意味著你不必呼叫 `clone`，這使得程式碼更為簡潔。

所有能用 `Copy` 完成的事情，你也可以用 `Clone` 來完成，但程式碼可能會比較慢，或者必須在某些地方使用 `clone`。

## 用於將值對應到固定大小值的 Hash

`Hash` trait 讓你可以取一個任意大小的型別實體，並使用一個雜湊函式（hash function）將該實體對應到一個固定大小的值。派生 `Hash` 會實作 `hash` 方法。`hash` 方法的派生實作會結合對型別每個部分呼叫 `hash` 的結果，這意味著所有欄位或值也必須實作 `Hash` 才能派生 `Hash`。

`Hash` 的一個必要使用範例是，當在 `HashMap<K, V>` 中儲存 key 時，以便有效地儲存資料。

## 用於預設值的 Default

`Default` trait 讓你可以為一個型別建立一個預設值。派生 `Default` 會實作 `default` 函式。`default` 函式的派生實作會對型別的每個部分呼叫 `default` 函式，這意味著型別中的所有欄位或值也必須實作 `Default` 才能派生 `Default`。

`Default::default` 函式通常與第 XX 頁的「使用 Struct 更新語法從其他實體建立實體」中討論的 struct 更新語法結合使用。你可以自訂 struct 的幾個欄位，然後使用 `..Default::default()` 為其餘欄位設定並使用預設值。

`Default` trait 是必需的，例如當你在 `Option<T>` 實體上使用 `unwrap_or_default` 方法時。如果 `Option<T>` 是 `None`，`unwrap_or_default` 方法將會回傳儲存在 `Option<T>` 中的型別 `T` 的 `Default::default` 的結果。
