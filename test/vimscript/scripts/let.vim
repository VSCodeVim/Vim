" Basic let
let x = 2 + 2
call assert_equal(4, x)
let x += 7
call assert_equal(11, x)

let x = toupper('abc')
call assert_equal('ABC', x)
let x ..= 'def'
call assert_equal('ABCdef', x)

" Namespace
let s:x = 2 + 2
call assert_equal(4, s:x)
call assert_equal('ABCdef', x)

" Index
let x = [1, 2, 3, 4, 5]
let x[2] *= 10
call assert_equal([1, 2, 30, 4, 5], x)

" Slice
let x = [1, 2, 3, 4, 5]
let x[1:3] = ['a', 'b', 'c']
call assert_equal([1, 'a', 'b', 'c', 5], x)

" Unpack
let [x, y, z] = [1, 2, 3]
call assert_equal(1, x)
call assert_equal(2, y)
call assert_equal(3, z)

let [x, y, z] *= [10, 10, 10]
call assert_equal(10, x)
call assert_equal(20, y)
call assert_equal(30, z)

" Set register
let @a = 'hello'
call assert_equal('hello', @a)

" TODO:
" let x = [0, 1]
" let i = 0
" let [i, x[i]] = [1, 2]
" call assert_equal([0, 2], x)
