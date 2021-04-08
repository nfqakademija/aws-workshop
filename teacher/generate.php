#!/usr/bin/env php
<?php

$awsSub = fn($v) => ["Fn::Sub" => $v];
$shortNotations = [
    '!Ref' => fn($v) => ["Ref" => $v],
    '!Sub' => fn($v) => ["Fn::Sub" => $v],
    '!Split' => fn($v) => ["Fn::Split" => $v],
    '!Join' => fn($v) => ["Fn::Join" => $v],
    '!ImportValue' => fn($v) => ["Fn::ImportValue" => $v],
    '!FindInMap' => fn($v) => ["Fn::FindInMap" => $v],
    '!GetAtt' => fn($v) => ["Fn::GetAtt" => explode('.', $v)],
];

$template = yaml_parse(file_get_contents("cfn-stack.yaml"), 0, $ndocs, $shortNotations);
if (file_exists("students.local.yaml")) {
    $students = yaml_parse(file_get_contents("students.local.yaml"));
} else {
    $students = yaml_parse(file_get_contents("students.yaml"));
}

$colleague = $template['Resources']['Colleague1'];
unset($template['Resources']['Colleague1']);

foreach ($students as $i => $email) {
    # Password need upper, lower, number, special char
    $colleague["Properties"]['LoginProfile']['Password'] = bin2hex(openssl_random_pseudo_bytes(10)) . 'U-' . bin2hex(openssl_random_pseudo_bytes(10));
    $colleague["Properties"]['UserName'] = $email;
    $resourceName = 'Colleague' . ($i + 1);
    $template['Resources'][$resourceName] = $colleague;
}

echo yaml_emit($template);