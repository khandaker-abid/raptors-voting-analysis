package com.example.raptorsbackend.constants;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class AppConstants {

    private AppConstants() {
    }

    public static final int DEFAULT_EAVS_YEAR = 2024;

    public static final List<Integer> EAVS_YEAR_PRIORITY = List.of(2024, 2020, 2016);

    public static final List<Integer> DROPBOX_YEAR_PRIORITY = List.of(2024, 2020);

    public static final double PERCENTAGE_MULTIPLIER = 100.0;

    public static final double DECIMAL_PRECISION = 10.0;

    public static final Map<String, String> STATE_ABBR_MAP;

    static {
        Map<String, String> map = new HashMap<>();
        map.put("ALABAMA", "AL");
        map.put("ALASKA", "AK");
        map.put("ARIZONA", "AZ");
        map.put("ARKANSAS", "AR");
        map.put("CALIFORNIA", "CA");
        map.put("COLORADO", "CO");
        map.put("CONNECTICUT", "CT");
        map.put("DELAWARE", "DE");
        map.put("DISTRICT OF COLUMBIA", "DC");
        map.put("FLORIDA", "FL");
        map.put("GEORGIA", "GA");
        map.put("HAWAII", "HI");
        map.put("IDAHO", "ID");
        map.put("ILLINOIS", "IL");
        map.put("INDIANA", "IN");
        map.put("IOWA", "IA");
        map.put("KANSAS", "KS");
        map.put("KENTUCKY", "KY");
        map.put("LOUISIANA", "LA");
        map.put("MAINE", "ME");
        map.put("MARYLAND", "MD");
        map.put("MASSACHUSETTS", "MA");
        map.put("MICHIGAN", "MI");
        map.put("MINNESOTA", "MN");
        map.put("MISSISSIPPI", "MS");
        map.put("MISSOURI", "MO");
        map.put("MONTANA", "MT");
        map.put("NEBRASKA", "NE");
        map.put("NEVADA", "NV");
        map.put("NEW HAMPSHIRE", "NH");
        map.put("NEW JERSEY", "NJ");
        map.put("NEW MEXICO", "NM");
        map.put("NEW YORK", "NY");
        map.put("NORTH CAROLINA", "NC");
        map.put("NORTH DAKOTA", "ND");
        map.put("OHIO", "OH");
        map.put("OKLAHOMA", "OK");
        map.put("OREGON", "OR");
        map.put("PENNSYLVANIA", "PA");
        map.put("RHODE ISLAND", "RI");
        map.put("SOUTH CAROLINA", "SC");
        map.put("SOUTH DAKOTA", "SD");
        map.put("TENNESSEE", "TN");
        map.put("TEXAS", "TX");
        map.put("UTAH", "UT");
        map.put("VERMONT", "VT");
        map.put("VIRGINIA", "VA");
        map.put("WASHINGTON", "WA");
        map.put("WEST VIRGINIA", "WV");
        map.put("WISCONSIN", "WI");
        map.put("WYOMING", "WY");
        STATE_ABBR_MAP = Collections.unmodifiableMap(map);
    }

    public static final Map<String, String> RI_TOWN_TO_COUNTY_MAP;

    static {
        Map<String, String> riMap = new HashMap<>();
        riMap.put("BARRINGTON TOWN", "BRISTOL COUNTY");
        riMap.put("BRISTOL TOWN", "BRISTOL COUNTY");
        riMap.put("WARREN TOWN", "BRISTOL COUNTY");
        riMap.put("COVENTRY TOWN", "KENT COUNTY");
        riMap.put("EAST GREENWICH TOWN", "KENT COUNTY");
        riMap.put("WARWICK CITY", "KENT COUNTY");
        riMap.put("WEST GREENWICH TOWN", "KENT COUNTY");
        riMap.put("WEST WARWICK TOWN", "KENT COUNTY");
        riMap.put("JAMESTOWN TOWN", "NEWPORT COUNTY");
        riMap.put("LITTLE COMPTON TOWN", "NEWPORT COUNTY");
        riMap.put("MIDDLETOWN TOWN", "NEWPORT COUNTY");
        riMap.put("NEWPORT CITY", "NEWPORT COUNTY");
        riMap.put("PORTSMOUTH TOWN", "NEWPORT COUNTY");
        riMap.put("TIVERTON TOWN", "NEWPORT COUNTY");
        riMap.put("BURRILLVILLE TOWN", "PROVIDENCE COUNTY");
        riMap.put("CENTRAL FALLS CITY", "PROVIDENCE COUNTY");
        riMap.put("CRANSTON CITY", "PROVIDENCE COUNTY");
        riMap.put("CUMBERLAND TOWN", "PROVIDENCE COUNTY");
        riMap.put("EAST PROVIDENCE CITY", "PROVIDENCE COUNTY");
        riMap.put("FOSTER TOWN", "PROVIDENCE COUNTY");
        riMap.put("GLOCESTER TOWN", "PROVIDENCE COUNTY");
        riMap.put("JOHNSTON TOWN", "PROVIDENCE COUNTY");
        riMap.put("LINCOLN TOWN", "PROVIDENCE COUNTY");
        riMap.put("NORTH PROVIDENCE TOWN", "PROVIDENCE COUNTY");
        riMap.put("NORTH SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        riMap.put("PAWTUCKET CITY", "PROVIDENCE COUNTY");
        riMap.put("PROVIDENCE CITY", "PROVIDENCE COUNTY");
        riMap.put("SCITUATE TOWN", "PROVIDENCE COUNTY");
        riMap.put("SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        riMap.put("WOONSOCKET CITY", "PROVIDENCE COUNTY");
        riMap.put("CHARLESTOWN TOWN", "WASHINGTON COUNTY");
        riMap.put("EXETER TOWN", "WASHINGTON COUNTY");
        riMap.put("HOPKINTON TOWN", "WASHINGTON COUNTY");
        riMap.put("NARRAGANSETT TOWN", "WASHINGTON COUNTY");
        riMap.put("NEW SHOREHAM TOWN", "WASHINGTON COUNTY");
        riMap.put("NORTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        riMap.put("RICHMOND TOWN", "WASHINGTON COUNTY");
        riMap.put("SOUTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        riMap.put("WESTERLY TOWN", "WASHINGTON COUNTY");
        RI_TOWN_TO_COUNTY_MAP = Collections.unmodifiableMap(riMap);
    }

    public static final String FIELD_PROVISIONAL_TOTAL = "E1a";

    public static final String[] POLLBOOK_DELETION_FIELDS = {
            "A12b", "A12c", "A12d", "A12e", "A12f", "A12g", "A12h"
    };

    public static final String EQUIPMENT_DRE_NO_VVPAT = "DRE no VVPAT";
    public static final String EQUIPMENT_DRE_WITH_VVPAT = "DRE with VVPAT";
    public static final String EQUIPMENT_BMD = "Ballot Marking Device";
    public static final String EQUIPMENT_SCANNER = "Scanner";
    public static final String EQUIPMENT_MIXED = "MIXED";
}
