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

// Cache passwords, so Student UI would not need to refresh them after change in template
$passwords = [];
if (file_exists("students.passwords.local.yaml")) {
    $passwords = yaml_parse(file_get_contents("students.passwords.local.yaml"));
} else {
    foreach (array_keys($students) as $i) {
        $passwords[$i] = bin2hex(openssl_random_pseudo_bytes(10)) . 'U-' . bin2hex(openssl_random_pseudo_bytes(10));
    }
    file_put_contents("students.passwords.local.yaml", yaml_emit($passwords));
}


$colleague = $template['Resources']['Colleague1'];
unset($template['Resources']['Colleague1']);

foreach ($students as $i => $email) {
    // Password need upper, lower, number, special char
    $colleague["Properties"]['LoginProfile']['Password'] = $passwords[$i];
    $colleague["Properties"]['UserName'] = $email;
    $resourceName = 'Colleague' . ($i + 1);
    $template['Resources'][$resourceName] = $colleague;
}

$colleagueAccessKey = $template['Resources']['Colleague1AccessKey'];
unset($template['Resources']['Colleague1AccessKey']);
$outputAccessKeyId = $template['Outputs']['Colleague1AccessKeyId'];
unset($template['Outputs']['Colleague1AccessKeyId']);
$outputSecretKey = $template['Outputs']['Colleague1SecretKey'];
unset($template['Outputs']['Colleague1SecretKey']);


foreach (array_keys($students) as $i) {
    $resourceName = 'Colleague' . ($i + 1);
    $colleagueAccessKey['Properties']['UserName'] = ['Ref' => $resourceName];
    $template['Resources'][$resourceName . 'AccessKey'] = $colleagueAccessKey;

    $outputAccessKeyId['Value'] = ['Ref' => $resourceName . 'AccessKey'];
    $template['Outputs'][$resourceName . 'AccessKeyId'] = $outputAccessKeyId;

    $outputSecretKey['Value'] = ['Fn::GetAtt' => [$resourceName . 'AccessKey', 'SecretAccessKey']];
    $template['Outputs'][$resourceName . 'SecretKey'] = $outputSecretKey;
}

echo yaml_emit($template);