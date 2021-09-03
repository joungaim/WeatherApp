import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import moment from "moment";

const API_KEY =
  "Skm8Sx%2BhuSd8PBsZeDzGPZVXFlXODLxEJR2MRRajPQqn1aID2DYuEYoMC97NhdpJ4AzetqrX2xTDHtIUKnTX1g%3D%3D";

// 위,경도 -> 좌표변환 하기 위한 기본값
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 투영 위도1(degree)
const SLAT2 = 60.0; // 투영 위도2(degree)
const OLON = 126.0; // 기준점 경도(degree)
const OLAT = 38.0; // 기준점 위도(degree)
const XO = 43; // 기준점 X좌표(GRID)
const YO = 136; // 기1준점 Y좌표(GRID)
//

export default function App() {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [baseDate, setBaseDate] = useState(null);
  const [baseTime, setBaseTime] = useState("0200");
  let [weatherData, setWeatherData] = useState();
  // 날씨 데이터
  const [pop, setPop] = useState(); // 강수확률 단위 : %
  const [pty, setPty] = useState(); // 강수형태
  const [pcp, setPcp] = useState(); // 1시간 강수량
  const [reh, setReh] = useState(); // 습도 단위 : %
  const [sno, setSno] = useState(); // 1시간 신적설(눈 쌓인 양)
  const [sky, setSky] = useState(); // 하늘상태
  const [tmp, setTmp] = useState(); // 1시간 기온 단위 :℃
  const [tmn, setTmn] = useState(); // 일 최저기온 단위 :℃
  const [tmx, setTmx] = useState(); // 일 최고기온 단위 :℃
  const [uuu, setUuu] = useState(); // 풍속(동서성분) : m/s
  const [vvv, setVvv] = useState(); // 풍속(남북성분) : m/s
  const [vec, setVec] = useState(); // 풍향 : deg
  const [wsd, setWsd] = useState(); // 풍속 : m/s
  // 날씨 데이터

  getTime = async () => {
    var todayDate = moment().format("YYYYMMDD");
    var currentTime = moment().format("HHmm"); //현재 시간분 (HH:24h / hh:12h)
    var yesterdayDate = moment().subtract(1, "days"); // 어제날짜 구하기
    yesterdayDate = moment(yesterdayDate).format("YYYYMMDD"); // 어제날짜 포맷 재 설정
    var baseTime;

    setBaseDate(todayDate);
    // 기상청 정보는 1일 총 8번 업데이트 된다.(0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)
    // moment(currentTime).isBetween("1200", "0210") : 1200 <= currentTime < 0210 : 1200은 포함되고 (true) 0210은 포함되지 않음(flase)
    if (moment(currentTime).isBetween("1200", "0211")) {
      // 0시~2시 10분 사이 : base_date가 어제 날짜로 바뀌어야 한다.
      setBaseDate(yesterdayDate);
      baseTime = "2300";
    } else if (moment(currentTime).isBetween("0211", "0511")) {
      // 2시 11분~5시 10분 사이
      baseTime = "0200";
    } else if (moment(currentTime).isBetween("0511", "0811")) {
      // 5시 11분~8시 10분 사이
      baseTime = "0500";
    } else if (moment(currentTime).isBetween("0811", "1111")) {
      // 8시 11분~11시 10분 사이
      baseTime = "0800";
    } else if (moment(currentTime).isBetween("1111", "1411")) {
      // 11시 11분~14시 10분 사이
      baseTime = "1100";
    } else if (moment(currentTime).isBetween("1411", "1711")) {
      // 14시 11분~17시 10분 사이
      baseTime = "1400";
    } else if (moment(currentTime).isBetween("1711", "2011")) {
      // 17시 11분~20시 10분 사이
      baseTime = "1700";
    } else if (moment(currentTime).isBetween("2011", "2311")) {
      // 20시 11분~23시 10분 사이
      baseTime = "2000";
    } else {
      // 23시 11분~23시 59분
      baseTime = "2300";
    }

    setBaseTime(baseTime);
  };

  getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    console.log(location.coords.latitude + "/" + location.coords.longitude);
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);

    const rs = await getGridGPS(); // 위도,경도를 기상청 api에 활용 가능한 x,y로 바꾸는 함수
    getWeather(rs.x, rs.y); // 좌표 값 사용하여 날씨데이터 받아오는 함수
  };

  // 위,경도 -> 좌표변환 함수
  getGridGPS = async () => {
    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn =
      Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
      Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);
    var rs = {};

    // toXY : 위,경도를 좌표로 변경
    //if (code == "toXY") {

    rs["lat"] = latitude; // 객체 rs에 "lat"를 이름으로 하는 key 를 생성하고, 변수 latitude을 value로 할당한다.
    rs["lng"] = longitude; // 객체 rs에 "lng"를 이름으로 하는 key 를 생성하고, 변수 longitude을 value로 할당한다.
    var ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5);
    ra = (re * sf) / Math.pow(ra, sn);
    var theta = longitude * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    rs["x"] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs["y"] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    // else : 좌표를 위,경도로 변경
    // else {
    //   rs["x"] = v1;
    //   rs["y"] = v2;
    //   var xn = v1 - XO;
    //   var yn = ro - v2 + YO;
    //   ra = Math.sqrt(xn * xn + yn * yn);
    //   if (sn < 0.0) -ra;
    //   var alat = Math.pow((re * sf) / ra, 1.0 / sn);
    //   alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

    //   if (Math.abs(xn) <= 0.0) {
    //     theta = 0.0;
    //   } else {
    //     if (Math.abs(yn) <= 0.0) {
    //       theta = Math.PI * 0.5;
    //       if (xn < 0.0) -theta;
    //     } else theta = Math.atan2(xn, yn);
    //   }
    //   var alon = theta / sn + olon;
    //   rs["lat"] = alat * RADDEG;
    //   rs["lng"] = alon * RADDEG;
    // }

    return rs;
  };

  // nx,ny : 위,경도를 좌표로 바꾼 각각의 값
  getWeather = async (nx, ny) => {
    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${API_KEY}&numOfRows=20&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
    console.log(
      nx +
        "," +
        ny +
        "," +
        baseDate +
        "," +
        baseTime +
        "," +
        API_KEY +
        ", url :" +
        url
    );
    await axios
      .get(url)
      .then(function (response) {
        const WeatherResponseData = response.data.response.body.items.item; //필요한 정보만 받아오기 전부 다 받아 오려면 response.data 까지만 적는다.
        setWeatherData(WeatherResponseData);
      })
      .catch(function (error) {
        console.log("실패 : " + error);
      });
    // weatherData 배열을 훑으며 "category"값을 key로 하고 fcstValue 값을 value로 하는 새로운 배열 생성
    // var weatherDataArray = weatherData.map(function (weatherDataArr) { // map 사용한 동일 코드 : return 값 있어야 함.
    weatherData.forEach(function (weatherDataArr) {
      let weatherDataObj = {};
      let weatherDataObjKey = weatherDataArr["category"];
      weatherDataObj[weatherDataObjKey] = weatherDataArr.fcstValue;
      console.log(weatherDataObj);
      // switch (weatherDataArr["category"]) {
      //   case "POP":
      //     setPop(weatherDataArr.fcstValue);
      //     break;
      //   case "PTY":
      //     setPty(weatherDataArr.fcstValue);
      //     break;
      //   case "PCP":
      //     setPcp(weatherDataArr.fcstValue);
      //     break;
      //   case "REH":
      //     setReh(weatherDataArr.fcstValue);
      //     break;
      //   case "SNO":
      //     setSno(weatherDataArr.fcstValue);
      //     break;
      //   case "SKY":
      //     setSky(weatherDataArr.fcstValue);
      //     break;
      //   case "TMP":
      //     setTmp(weatherDataArr.fcstValue);
      //     break;
      //   case "TMN":
      //     setTmn(weatherDataArr.fcstValue);
      //     break;
      //   case "TMX":
      //     setTmx(weatherDataArr.fcstValue);
      //     break;
      //   case "UUU":
      //     setUuu(weatherDataArr.fcstValue);
      //     break;
      //   case "VVV":
      //     setVvv(weatherDataArr.fcstValue);
      //     break;
      //   case "VEC":
      //     setVec(weatherDataArr.fcstValue);
      //     break;
      //   case "WSD":
      //     setWsd(weatherDataArr.fcstValue);
      //     break;
      // }
    });
  };

  // 클래스 생명주기 메서드 중 componentDidMount() 와 동일한 기능을 한다.
  // useEffect는첫번째 렌더링과 이후의 모든 업데이트에서 수행됩니다.
  useEffect(() => {
    getTime();
    getLocation();
  }, []);
  // 빈 배열을 넣어 주면 처음 랜더링 될 때 한번만 실행 된다. 넣지 않으면 모든 업데이트에서 실행되며
  // 배열안에 [count] 같이 인자를 넣어주면 해당 인자가 업데이트 될 때 마다 실행된다.

  //const { latitude, longitude } = this.state;
  return (
    <View style={styles.container}>
      <Text>
        강수확률 : {pop} % / PTY : {pty} / PCP :{pcp} / 습도 : {reh} %
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
