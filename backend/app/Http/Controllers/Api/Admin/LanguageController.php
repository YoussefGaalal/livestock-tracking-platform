<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LanguageController extends Controller
{
    public function index()
    {
        $languages = DB::table('languages')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        
        return response()->json($languages);
    }

    public function show(string $code)
    {
        $language = DB::table('languages')
            ->where('code', $code)
            ->where('is_active', true)
            ->first();
        
        if (!$language) {
            return response()->json(['error' => 'Language not found'], 404);
        }
        
        return response()->json($language);
    }

    public function translations(Request $request)
    {
        $query = DB::table('translations')
            ->join('languages', 'translations.language_code', '=', 'languages.code')
            ->where('languages.is_active', true);
        
        if ($request->has('group')) {
            $query->where('group', $request->group);
        }
        
        if ($request->has('lang')) {
            $query->where('language_code', $request->lang);
        }
        
        $translations = $query->select('translations.*')->get();
        
        return response()->json($translations);
    }

    public function getAllTranslationsForLocale(Request $request)
    {
        $locale = $request->get('lang', 'en');
        
        $uiTranslations = DB::table('translations')
            ->where('language_code', $locale)
            ->get()
            ->pluck('value', 'key');
        
        $uiGrouped = [];
        foreach ($uiTranslations as $key => $value) {
        }
        
        $modelTranslations = [];
        
        $species = DB::table('species')->get();
        foreach ($species as $s) {
            $nameJson = json_decode($s->name_json ?? '{}', true);
            $descJson = json_decode($s->description_json ?? '{}', true);
            $modelTranslations['species.' . $s->id . '.name'] = $nameJson[$locale] ?? $s->name;
            $modelTranslations['species.' . $s->id . '.description'] = $descJson[$locale] ?? $s->description;
        }
        
        $breeds = DB::table('breeds')->get();
        foreach ($breeds as $b) {
            $nameJson = json_decode($b->name_json ?? '{}', true);
            $descJson = json_decode($b->description_json ?? '{}', true);
            $modelTranslations['breed.' . $b->id . '.name'] = $nameJson[$locale] ?? $b->name;
            $modelTranslations['breed.' . $b->id . '.description'] = $descJson[$locale] ?? $b->description;
        }
        
        $geofences = DB::table('geofences')->get();
        foreach ($geofences as $g) {
            $nameJson = json_decode($g->name_json ?? '{}', true);
            $modelTranslations['geofence.' . $g->id . '.name'] = $nameJson[$locale] ?? $g->name;
        }
        
        $groups = DB::table('animal_groups')->get();
        foreach ($groups as $grp) {
            $nameJson = json_decode($grp->name_json ?? '{}', true);
            $descJson = json_decode($grp->description_json ?? '{}', true);
            $modelTranslations['group.' . $grp->id . '.name'] = $nameJson[$locale] ?? $grp->name;
            $modelTranslations['group.' . $grp->id . '.description'] = $descJson[$locale] ?? $grp->description;
        }
        
        $tiers = DB::table('subscription_tiers')->get();
        foreach ($tiers as $t) {
            $nameJson = json_decode($t->name_json ?? '{}', true);
            $descJson = json_decode($t->description_json ?? '{}', true);
            $modelTranslations['tier.' . $t->id . '.name'] = $nameJson[$locale] ?? $t->name;
            $modelTranslations['tier.' . $t->id . '.description'] = $descJson[$locale] ?? $t->description;
        }
        
        $uiGrouped = [];
        foreach ($uiTranslations as $key => $value) {
            $uiGrouped['ui.' . $key] = $value;
        }
        
        $allTranslations = array_merge($uiGrouped, $modelTranslations);
        
        return response()->json($allTranslations);
    }

    public function getTranslationsByGroup(string $group, Request $request)
    {
        $lang = $request->get('lang', 'en');
        
        $translations = DB::table('translations')
            ->where('group', $group)
            ->where('language_code', $lang)
            ->get()
            ->pluck('value', 'key');
        
        return response()->json($translations);
    }

    public function allLanguages(Request $request)
    {
        $languages = DB::table('languages')
            ->orderBy('sort_order')
            ->get();
        
        return response()->json(['data' => $languages]);
    }

    public function storeLanguage(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:languages,code|regex:/^[a-z]{2,3}$/',
            'name' => 'required|string|max:50',
            'native_name' => 'required|string|max:50',
            'direction' => 'required|in:ltr,rtl',
        ]);

        $maxOrder = DB::table('languages')->max('sort_order') ?? 0;
        
        $id = DB::table('languages')->insertGetId([
            'code' => strtolower($validated['code']),
            'name' => $validated['name'],
            'native_name' => $validated['native_name'],
            'direction' => $validated['direction'],
            'is_active' => true,
            'is_default' => false,
            'sort_order' => $maxOrder + 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Language created successfully'], 201);
    }

    public function updateLanguage(Request $request, string $code)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'native_name' => 'sometimes|string|max:50',
            'direction' => 'sometimes|in:ltr,rtl',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ]);

        $exists = DB::table('languages')->where('code', $code)->first();
        if (!$exists) {
            return response()->json(['error' => 'Language not found'], 404);
        }

        if (isset($validated['is_default']) && $validated['is_default']) {
            DB::table('languages')->update(['is_default' => false]);
        }

        DB::table('languages')
            ->where('code', $code)
            ->update(array_merge($validated, ['updated_at' => now()]));

        return response()->json(['message' => 'Language updated successfully']);
    }

    public function deleteLanguage(string $code)
    {
        $language = DB::table('languages')->where('code', $code)->first();
        
        if (!$language) {
            return response()->json(['error' => 'Language not found'], 404);
        }

        if ($language->is_default) {
            return response()->json(['error' => 'Cannot delete default language'], 400);
        }

        DB::table('languages')->where('code', $code)->delete();
        DB::table('translations')->where('language_code', $code)->delete();

        return response()->json(['message' => 'Language deleted successfully']);
    }

    public function setDefaultLanguage(string $code)
    {
        $language = DB::table('languages')->where('code', $code)->first();
        
        if (!$language) {
            return response()->json(['error' => 'Language not found'], 404);
        }

        DB::table('languages')->update(['is_default' => false]);
        DB::table('languages')->where('code', $code)->update(['is_default' => true]);

        return response()->json(['message' => 'Default language set successfully']);
    }

    public function storeTranslation(Request $request)
    {
        $validated = $request->validate([
            'language_code' => 'required|exists:languages,code',
            'group' => 'required|string|max:50',
            'key' => 'required|string|max:100',
            'value' => 'required|string',
        ]);

        $exists = DB::table('translations')
            ->where('language_code', $validated['language_code'])
            ->where('group', $validated['group'])
            ->where('key', $validated['key'])
            ->first();

        if ($exists) {
            DB::table('translations')
                ->where('id', $exists->id)
                ->update([
                    'value' => $validated['value'],
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('translations')->insert([
                'language_code' => $validated['language_code'],
                'group' => $validated['group'],
                'key' => $validated['key'],
                'value' => $validated['value'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Translation saved successfully']);
    }

    public function updateTranslation(Request $request, int $id)
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $translation = DB::table('translations')->where('id', $id)->first();
        
        if (!$translation) {
            return response()->json(['error' => 'Translation not found'], 404);
        }

        DB::table('translations')
            ->where('id', $id)
            ->update([
                'value' => $validated['value'],
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Translation updated successfully']);
    }

    public function deleteTranslation(int $id)
    {
        $translation = DB::table('translations')->where('id', $id)->first();
        
        if (!$translation) {
            return response()->json(['error' => 'Translation not found'], 404);
        }

        DB::table('translations')->where('id', $id)->delete();

        return response()->json(['message' => 'Translation deleted successfully']);
    }

    public function importTranslations(Request $request)
    {
        $validated = $request->validate([
            'translations' => 'required|array',
        ]);

        foreach ($validated['translations'] as $translation) {
            DB::table('translations')->updateOrInsert(
                [
                    'language_code' => $translation['language_code'],
                    'group' => $translation['group'],
                    'key' => $translation['key'],
                ],
                [
                    'value' => $translation['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        return response()->json(['message' => 'Translations imported successfully']);
    }
}