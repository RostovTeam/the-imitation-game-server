<?
//$_GET['email'];

$file = 'email.txt';
// Открываем файл для получения существующего содержимого
$current = file_get_contents($file);
// Добавляем нового человека в файл
$current .= $_GET['email']."\n";
// Пишем содержимое обратно в файл
file_put_contents($file, $current);