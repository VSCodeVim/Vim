" For now, just ensure that a function's body is not run when it's defined
function! Foo()
  call assert_report('Foo was called!')
endfunction
