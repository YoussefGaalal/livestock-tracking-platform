<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExportDatabase extends Command
{
    protected $signature = 'app:export-database {filename? : The filename to export to}';
    protected $description = 'Export database to SQL file';

    public function handle()
    {
        $filename = $this->argument('filename') ?? database_path('oasis_staging_v0.1.sql');
        $outputPath = base_path($filename);
        
        $this->info("Exporting database to: $outputPath");
        
        $tables = DB::select('SHOW TABLES');
        $databaseName = config('database.connections.mysql.database');
        
        $sql = "-- Database Export: $databaseName\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
        
        foreach ($tables as $tableObj) {
            $tableName = $tableObj->{'Tables_in_' . $databaseName};
            $this->info("Exporting table: $tableName");
            
            // Drop table
            $sql .= "\nDROP TABLE IF EXISTS `$tableName`;\n";
            
            // Get create table statement
            $create = DB::select("SHOW CREATE TABLE `$tableName`")[0];
            $sql .= $create->{'Create Table'} . ";\n";
            
            // Get data
            $rows = DB::select("SELECT * FROM `$tableName`");
            if (count($rows) > 0) {
                foreach ($rows as $row) {
                    $values = [];
                    foreach ($row as $value) {
                        if (is_null($value)) {
                            $values[] = 'NULL';
                        } elseif (is_numeric($value) && !is_string($value)) {
                            $values[] = $value;
                        } else {
                            $values[] = "'" . str_replace("'", "\\'", strval($value)) . "'";
                        }
                    }
                    $sql .= "INSERT INTO `$tableName` VALUES (" . implode(', ', $values) . ");\n";
                }
            }
        }
        
        $sql .= "\nSET FOREIGN_KEY_CHECKS=1;\n";
        
        file_put_contents($outputPath, $sql);
        $this->info("Export complete: $outputPath");
        
        return 0;
    }
}