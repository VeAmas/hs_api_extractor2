import { PERMISE_NO_LIST, PERMISE_NO_LIST_COPY } from './CommonData';
import { querySysDatadictBatch, getUserRoleList } from '../api';
import hui from 'h_ui/dist/h_ui.min.js';
import Vue from 'vue';
import hCore from 'hui-core';
import baseClone from './lodash/baseClone.js';

export function resolveThirdPartyResources(app, id, _url) {
  let url = _url;
  return new Promise((resolve, reject) => {
    // 2.0 业务系统构建
    if (process.env.HUI_BUILD_TARGET === 'app') {
      const isMicroApp = hCore.utils.isMicroApp();
      if (!url && isMicroApp) {
        // eslint-disable-next-line no-useless-catch
        try {
          // 获取业务系统的部署路径，要求主系统在 root 状态模块中新增 apps 状态值，存储业务系统的配置信息
          // const { root } = store.state;
          // const { entry } = root.apps.find((item) => app === item.name);
          const {
            FRAME_CONFIG: { APPS }
          } = window;
          const { entry } = APPS.find(item => app === item.name);
          const flag = entry.endsWith('/');
          url = `${entry}${flag ? '' : '/'}libs/${id}.js`;
        } catch (error) {
          throw error;
        }
      }

      // eslint-disable-next-line
      return url ? requirejs([url], resolve, reject) : reject('NOT FOUND');
    }
  });
}

// 判断item是否存在数组arr中
export function isInArray(item, arr) {
  let flag = false;
  for (let i = 0; i < arr.length; i++) {
    if (item === arr[i]) {
      flag = true;
      break;
    }
  }
  return flag;
}
import { registerGlobalComponents } from 'ambf-common-js/common/entry/component.js';
import fetch from '../api/httpFetch';
import { isUcf } from 'ambf-common-js/common/utils';

/**
 * 存储数据字典
 * @param store vue实例中的store对象
 * @param state store模块对应的state
 * @param CODES_MAP 模块对应的字典编码对象
 * @param stateKey 模块对应得mutations key，命名规范：${模块英文名称大写}_SET_DICTIONARIES
 * @param callback 字典存储后的回调
 * 此方法涉及接口调用，其他模块拷贝复用需注意
 */
export function setDictionary(store, state, CODES_MAP, stateKey, callback) {
  const codes = Object.keys(CODES_MAP)
    .map(item => CODES_MAP[item])
    .join(',');
  const pars = {
    dic_no_list_str: codes
  };
  store.commit(`${stateKey}_MAP`, CODES_MAP);
  if (!state.hasSet) {
    querySysDatadictBatch(pars).then(res => {
      store.commit(stateKey, res);
      callback && callback();
    });
  } else {
    callback && callback();
  }
}
// 取出两个数组中不同的元素
export function getArrDifference(arr1, arr2) {
  return arr1.concat(arr2).filter(function (currentValue, index, arr) {
    return arr.indexOf(currentValue) === arr.lastIndexOf(currentValue);
  });
}
// map属性驼峰转下划线
export function kebaseCase(data) {
  if (Array.isArray(data)) {
    return data.map(kebaseCase);
  }
  if (typeof data !== 'object' || !data) {
    return data;
  }
  return Object.keys(data).reduce((state, key) => {
    state[key.replace(/[A-Z]/g, _ => '_' + _.toLowerCase())] = kebaseCase(
      data[key]
    );
    return state;
  }, {});
}
// 时间格式化
export function dateFtt(_fmt, _val) {
  let val = _val;
  let fmt = _fmt;
  if (val === '' || val === undefined || val === null) return val;
  if (val.toString().length === 8) {
    const ary = val.toString().split('');
    val =
      String(
        String(
          String(String(String(ary[0]) + ary[1]) + ary[2]) +
            ary[3] +
            '-' +
            ary[4]
        ) +
          ary[5] +
          '-' +
          ary[6]
      ) + ary[7];
  }
  const date = new Date(val);
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      String(date.getFullYear()).substr(4 - RegExp.$1.length)
    );
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(String(o[k]).length)
      );
    }
  }
  return fmt;
}
// 下载文件
export function downloadFile(data, title) {
  if (!data) {
    return;
  }
  // eslint-disable-next-line no-use-before-define
  blobToText(data)
    .then(res => {
      const message = res.errorMessage || res.error_message;
      hui.hMessage.error({
        content: message
      });
    })
    .catch(() => {
      const blobObject = new Blob([data]);
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blobObject, title);
      } else {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute('download', title);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    });
}
// int8类型时间转字符串2019/01/01
export function int8toTimeStr(int, exp = '/') {
  if (!int) {
    return '';
  }
  return (
    String(int).substring(0, 4) +
    exp +
    String(int).substring(4, 6) +
    exp +
    String(int).substring(6)
  );
}
/**
 * 判断年份是否为润年
 *
 * @param {Number} year
 */
function isLeapYear(year) {
  return year % 400 == 0 || (year % 4 == 0 && year % 100 != 0);
}
/**
 * 获取某一年份的某一月份的天数
 *
 * @param {Number} year
 * @param {Number} month
 */
export function getMonthDays(year, month) {
  return (
    [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] ||
    (isLeapYear(year) ? 29 : 28)
  );
}
/**
 * 获取某年的某天是第几周
 * @param {Number} y
 * @param {Number} m
 * @param {Number} d
 * @returns {Number}
 */
export function getWeekNumber(y, m, d) {
  const now = new Date(y, m - 1, d);
  const year = now.getFullYear();
  const month = now.getMonth();
  let days = now.getDate();
  // 那一天是那一年中的第多少天
  for (let i = 0; i < month; i++) {
    days += getMonthDays(year, i);
  }
  // 那一年第一天是星期几
  const yearFirstDay = new Date(year, 0, 1).getDay() || 7;
  let week = null;
  if (yearFirstDay == 1) {
    week = Math.ceil(days / yearFirstDay);
  } else {
    days -= 7 - yearFirstDay + 1;
    week = Math.ceil(days / 7) + 1;
  }
  return week;
}
/**
 * @description 获取周的日期区间
 * @author wangwei26870
 * @date 2019-09-26
 * @export
 * @param {*} y
 * @param {*} m
 * @param {*} d
 * @returns
 */
export function getWeekZone(y, m, d) {
  const now = new Date(y, m - 1, d);
  const tody = now.getDay(); // 这一天是星期几
  // console.log(now)
  // console.log(tody)
  const start = now.getTime() - tody * 1000 * 60 * 60 * 24;
  const end = now.getTime() + (6 - tody) * 1000 * 60 * 60 * 24;
  // eslint-disable-next-line no-use-before-define
  return [getdayConnect(new Date(start), ''), getdayConnect(new Date(end), '')];
}
/**
 * @description 将日期变成字符串
 * @author wangwei26870
 * @date 2019-10-19
 * @export
 * @param {*} time
 * @param {*} exp
 * @returns
 */
export function getdayConnect(_time, exp = '') {
  let time = _time;
  if (!time) {
    return '';
  }
  if (typeof time === 'string') {
    if (time.length === 8) {
      time = int8toTimeStr(time, '-');
    }
    time = new Date(time);
  }
  let date = time.getFullYear() + exp;
  if (time.getMonth() + 1 < 10) {
    date += '0' + (time.getMonth() + 1) + exp;
  } else {
    date += time.getMonth() + 1 + exp;
  }
  if (time.getDate() < 10) {
    date += '0' + time.getDate();
  } else {
    date += time.getDate();
  }
  return date;
}
export function toggleClass(element, className) {
  if (!element || !className) {
    return;
  }
  let classString = element.className;
  const nameIndex = classString.indexOf(className);
  if (nameIndex === -1) {
    classString += ' ' + className;
  } else {
    classString =
      classString.substr(0, nameIndex) +
      classString.substr(nameIndex + className.length);
  }
  element.className = classString;
}
export function changeNodeProperty($this, data, key, value) {
  $this.$set(data, key, value);
  // data[key] = value; 不能更新视图
}
export function convert2StringDate(intDate) {
  let strDate = intDate.toString();
  strDate =
    strDate.substring(0, 4) +
    '-' +
    strDate.substring(4, 6) +
    '-' +
    strDate.substring(6, 8);
  return strDate;
}
/**
 * @description change the object's value to this type of String
 * @author wangwei26870
 * @date 2019-10-18
 * @export
 * @param {Object|Array} obj
 */
export function resetObjectValueToString(obj) {
  Object.keys(obj).forEach(res => {
    if (typeof obj[res] === 'number') {
      obj[res] = String(obj[res]);
    }
    if (obj[res] && typeof obj[res] === 'object') {
      resetObjectValueToString(obj[res]);
    }
  });
}
export function createUUID() {
  const s = [];
  const hexDigits = '0123456789abcdef';
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '';
  const uuid = s.join('');
  return uuid;
}
export function dateFtt2(_fmt, val) {
  let fmt = _fmt;
  if (val === '' || val === undefined || val === null) return val;
  const date = new Date(val);
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      String(date.getFullYear()).substr(4 - RegExp.$1.length)
    );
  for (const k in o)
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(String(o[k]).length)
      );
  return fmt;
}

function allCaps(text) {
  if (text < 'A' || text > 'Z') {
    return false;
  }
  return true;
}

/**
 * 数据库列名转属性(下划线转驼峰)
 * @param columnName 数据库列名
 * @return
 */
function columnName2FieldName(columnName) {
  let result = '';
  let upcaseFlag = false;
  if (!columnName || columnName === '') return columnName;
  for (let i = 0; i < columnName.length; i++) {
    const ch = columnName[i];
    if (ch === '_') {
      upcaseFlag = true;
      continue;
    } else if (upcaseFlag) {
      result += String(ch).toUpperCase();
      upcaseFlag = false;
    } else {
      result += ch;
      upcaseFlag = false;
    }
  }
  return result;
}

/**
 * 属性转数据库列名(驼峰传下划线)
 * @param str 属性名
 * @return
 */
export function fieldName2ColumnName(columnName) {
  let result = '';
  if (!columnName || columnName == '') return columnName;
  for (let i = 0; i < columnName.length; i++) {
    const ch = columnName[i];
    if (allCaps(ch)) {
      result += ('_' + ch).toLowerCase();
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * 数据库类型对象转驼峰型对象
 * @param obj 数据库类型对象
 * @param item 驼峰类型对象
 * @param type 转换类型（参数存在代表驼峰转成字段）
 * @param transStr 是否将value转换为字符串，默认为true
 * @return
 */
export function covertObj(obj, item, type = false, transStr = true) {
  const newObj = {};
  // eslint-disable-next-line guard-for-in
  for (const key in obj) {
    let fieldName = columnName2FieldName(key);
    if (type) {
      fieldName = fieldName2ColumnName(key);
    }
    let val = obj[key] !== undefined ? obj[key] : '';
    if (!transStr && val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        val = val.map(v => {
          if (typeof v === 'string' || typeof v === 'number') return v;
          const tempObj = {};
          covertObj(v, tempObj, type, transStr);
          return tempObj;
        });
      } else {
        const tempObj = {};
        covertObj(val, tempObj, type, transStr);
        val = tempObj;
      }
    }
    newObj[fieldName] = transStr ? String(val) : val;
  }
  Object.assign(item, newObj);
}
/**
 * 跨站脚本攻击，字符转义
 */
export function covertHtml(value) {
  if (!value) return '';
  const val = String(value);
  const tmval = val.toLowerCase(); // 转换成小写
  if (tmval == '' || tmval == 'undefined' || tmval == 'null') return '';
  const arrEntities = { '<': '&lt;', '>': '&gt;' };
  const rs = val.replace(/(<|>)/gi, function (all, t) {
    return arrEntities[t];
  });
  return rs;
}

/**
 * excel表格导出
 * @param fileName 导出文件名
 * @param urlMapping 表格的查询接口url(bu包含基础部分)
 * @param pars 表格查询接口参数
 * @param columns 表头
 */
export function exportExcel(
  fileName,
  urlMapping,
  pars,
  columns,
  excelType = '2007'
) {
  const suffix = excelType === '2007' ? '.xlsx' : '.xls';
  let pageParams = { ...pars };
  const newData = {};
  const isUnderscore = String(window.LOCAL_CONFIG.isUnderscore);
  if (isUnderscore == 'true') {
    // 兼容微服务方式
    covertObj(pageParams, newData, true, false);
    pageParams = newData;
  }
  fetch({
    url:
      window.HSFUNDRISK_CONFIG.API_HOME_RISKPUBDATA_HTTP +
      '/commonExport/commonExport',
    method: 'post',
    // headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    params: {
      heardes: JSON.stringify(columns),
      download_file_name: fileName,
      excel_type: excelType,
      url_mapping: urlMapping, // 查询表格接口
      param_data: JSON.stringify({
        page_no: 1,
        page_size: 60000,
        ...pageParams
      })
    },
    noFormat: true,
    responseType: 'blob'
  }).then(res => {
    if (res === undefined || res === null) {
      hui.hMessage.error('导出服务错误！');
    } else {
      const blobObject = new Blob([res.data]);
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blobObject, fileName + suffix);
      } else {
        const url = window.URL.createObjectURL(blobObject);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute('download', fileName + suffix);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    }
  });
}
/**
 * 数组中对象的健驼峰转下划线
 * @param Arr
 * @param type
 * @param transStr
 * @returns {*}
 */
export function arrayColumnName2FieldName(Arr, type, transStr) {
  const newArr = Arr.map(item => {
    let tempObj = null;
    if (typeof item === 'object') {
      if (Array.isArray(item)) {
        tempObj = arrayColumnName2FieldName(item, type, transStr);
      } else {
        tempObj = {};
        covertObj(item, tempObj, type, transStr);
      }
      return tempObj;
    } else {
      tempObj = item;
      return tempObj;
    }
  });
  return newArr;
}
export function deepClone(source) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'shallowClone');
  }
  const targetObj = source.constructor === Array ? [] : {};
  for (const keys in source) {
    if (source.hasOwnProperty(keys)) {
      if (source[keys] && typeof source[keys] === 'object') {
        targetObj[keys] = source[keys].constructor === Array ? [] : {};
        targetObj[keys] = deepClone(source[keys]);
      } else {
        targetObj[keys] = source[keys];
      }
    }
  }
  return targetObj;
}
export function removeBlank(str) {
  if (str !== null && str !== undefined) {
    return String(str).replace(/(^\s+)|(\s+$)/g, '');
  }
  return str;
}

// 格式化数字1000 => 1,000.00
export function outputmoney(number, decimals = 2) {
  if (isNaN(number) || number === '' || number === null) return '';
  let numberStr = String(number);
  // 是否是负数
  const isMin = numberStr.indexOf('-') !== -1;
  // 截取数组位
  numberStr = isMin ? numberStr.split('-')[1] : numberStr;
  // 按照小数点截取整数、小数部分
  const nums = numberStr.split('.');
  // 小数部分
  let rNum = numberStr.indexOf('.') !== -1 ? '0.' + nums[1] : 0;
  // 整数部分
  const lNum = nums[0];
  // 小数部分保留传入的位数
  rNum = Number(rNum).toFixed(decimals);
  // 每三位为一个元素保存数组
  const lNums = [];
  let item = '',
    count = 0;
  for (let i = lNum.length; i >= 0; i--) {
    if (count % 3 === 0 || i === 0) {
      // 避免第一个位置往数组里插入空字符串
      if (count !== 0) {
        lNums.push(item);
      }
      // 最后一次不需要执行初始化item
      if (i !== 0) {
        item = lNum.charAt(i - 1);
      }
    } else {
      item = String(lNum.charAt(i - 1)) + item;
    }
    count++;
  }

  // 进位变化
  let roundNums = [];
  if (Number(rNum) === 1) {
    // 截取小数
    rNum = rNum.split('.')[1];
    let hasAdd = false;
    for (let index = 0; index < lNums.length; index++) {
      if (Number(lNums[index]) + 1 === 1000) {
        // 三位进位为四位时，初始化当前位置为000
        roundNums.push('000');
        if (index === lNums.length - 1) {
          // 最后一个元素，新添加一个元素1
          roundNums.push('1');
        }
      } else if (!hasAdd) {
        // 元素进位
        roundNums.push(String(Number(lNums[index]) + 1));
        // 设置为已进位
        hasAdd = true;
      } else {
        // 元素直接插入新数组中
        roundNums.push(String(Number(lNums[index])));
      }
    }
  } else {
    rNum = rNum.split('.')[1];
    // 无进位，则直接赋值为截取的数组
    roundNums = lNums;
  }
  // 对整数位数组倒序并用，号拼接，同时拼接小数位
  return (isMin ? '-' : '') + roundNums.reverse().join(',') + '.' + rNum;
}

// 2019-11-27 zengchenhui添加 数字处理函数
export function numFormatter(_numStr) {
  let numStr = _numStr;
  if (numStr) {
    if (numStr[0] == '.') {
      numStr = '0' + numStr;
    }
    if (numStr[0] == '-' && numStr[1] == '.') {
      const arr = numStr.split('.');
      numStr = arr[0] + '0.' + arr[1];
    }
  }
  return numStr;
}

export function getArrayByString(str, exp = ';', exp1 = ':') {
  const result = [];
  str.split(exp).forEach(element => {
    const temp = element.split(exp1);
    if (temp.length) {
      result.push({
        value: temp[0],
        label: temp[1]
      });
    }
  });
  return result;
}

/* --------- indexcenter --------------- */
export function generatorFormList(data, targetObj) {
  // / / 生成表单数据
  // targetObj.combine.type = '2'
  if (data.dispPort !== '0') {
    if (data.dispPort === '1') {
      // 单选
      targetObj.combine.type = '1';
    } else {
      // 多选
      targetObj.combine.type = '2';
    }
  }
  // 报告配置组合列表回显过滤组合树，只显示配置的组合
  targetObj.accIds = data.accIds || [];

  if (data.dispBasi !== '0') {
    targetObj.base.type = '1';
  }
  targetObj.templateType = data.tmplType;
  targetObj.templateCode = data.tmplCode;
  targetObj.exportType = [];
  const array = data.expMode ? data.expMode.split('') : [];
  for (let i = 0; i < array.length; i++) {
    if (array[i] === '1') {
      targetObj.exportType.push({
        type: i === 0 ? 'excel' : i === 1 ? 'pdf' : 'word',
        id: i
      });
    }
  }
  //  data.dateFreq
  targetObj.date = {
    type: data.dateFreq,
    value: ''
  };
  data.indexParamList.forEach(res => {
    targetObj.formOtherList.push({
      label: res.paraDispName,
      engName: res.custParaEngName,
      type: res.paraWidgType,
      chkFlag: res.chkFlag,
      initvalue: res.codmCont,
      value: res.custParaDefVal,
      data: res,
      required: !!res.permEmptFlag,
      checkNode: {},
      paraUnitCode: res.paraUnitCode,
      prcs: res.prcs,
      formType: '指标',
      show: res.dispFlag === '1',
      max: res.paraMaxVal || Infinity,
      min: res.paraMinVal || -Infinity
    });
  });
  data.reportParamList.forEach(res => {
    targetObj.formOtherList.push({
      label: res.custParaName,
      engName: res.custParaEngName,
      type: res.paraWidgType,
      reportNumber: res.reptNum,
      paraName: res.custParaEngName,
      chkFlag: res.chkFlag,
      initvalue:
        res.paraWidgType === 'SimpleSelect'
          ? getArrayByString(res.codmCont)
          : res.codmCont,
      value: res.custParaDefVal,
      data: res,
      paraUnitCode: res.paraUnitCode,
      prcs: res.prcs,
      formType: '报告',
      show: res.dispFlag === '1',
      max: res.paraMaxVal || Infinity,
      min: res.paraMinVal || -Infinity
    });
  });
  data.subreportParamList.forEach(res => {
    targetObj.formOtherList.push({
      label: res.paraDispName,
      engName: res.custParaEngName,
      type: res.paraWidgType,
      chkFlag: res.chkFlag,
      initvalue: res.codmCont,
      value: res.custParaDefVal,
      data: res,
      paraUnitCode: res.paraUnitCode,
      prcs: res.prcs,
      formType: '子报告',
      show: res.dispFlag === '1',
      max: res.paraMaxVal || Infinity,
      min: res.paraMinVal || -Infinity
    });
  });
}

/**
 * @description 判断数据是否为空
 * @author wangwei26870
 * @date 2019-12-19
 * @export
 * @param {*} obj    Number,string ,Object ,Array,Boolean,undefined,null
 */
export function isNull(obj) {
  if (obj === null || obj === '' || obj === undefined) {
    return true;
  }
  // 数字的0做特殊判断
  if (obj === 0) {
    return false;
  }
  if (typeof obj === 'boolean') {
    return obj;
  }
  if (typeof obj === 'object') {
    const tmpVar = JSON.stringify(obj);
    if (tmpVar === '{}' || tmpVar === '[]') {
      return true;
    }
  }
  return false;
}

/* --------- indexcenter --------------- */

/**
 * @description 数字千分位分割
 * @date 2019-07-18
 * @param {String} num 金额数字
 */
export function divideNum(num) {
  let revalue = '';
  const array = String(num).split('.');
  const pointStr = array[1] ? '.' + array[1] : '';
  array[0] = array[0].replace(/-/g, '');
  if (array[0].length > 3) {
    while (array[0].length > 3) {
      revalue =
        ',' +
        array[0].substring(array[0].length - 3, array[0].length) +
        revalue;
      array[0] = array[0].substring(0, array[0].length - 3);
    }
  }
  return num >= 0
    ? array[0] + revalue + pointStr
    : '-' + array[0] + revalue + pointStr;
}

/**
 * 时间格式化
 * @param time
 * @returns {string}
 */
export function dateFormat(time) {
  const date = new Date(time);
  const year = date.getFullYear();
  /* 在日期格式中，月份是从0开始的，因此要加0
   * 使用三元表达式在小于10的前面加0，以达到格式统一  如 09:11:05
   * */
  const month =
    date.getMonth() + 1 < 10
      ? '0' + (date.getMonth() + 1)
      : date.getMonth() + 1;
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  // 拼接
  return year + '-' + month + '-' + day;
}

/**
 * @description  存储权限
 * @author wangzq28525
 * @date 2020-05-19
 * @export
 * @param {*} store
 * @param {*} PERMISE_NO_LIST
 * @param {*} PERMISE_NO_LIST_COPY
 * @param {*} key1
 * @param {*} key2
 * @param {*} callback
 */
export function setPerssions(store, callback) {
  if (!store.state.riskDataManage.isPerssionSet) {
    // 不是第一次请求
    const permissionKeys = Object.keys(PERMISE_NO_LIST).map(res => {
      return PERMISE_NO_LIST[res];
    });
    if (permissionKeys.length > 0) {
      // 没有权限列表
      store.commit('RISKDATAMANAGE_SET_PERMISSION_MAP', PERMISE_NO_LIST_COPY);
      getUserRoleList({
        right_list: permissionKeys
      }).then(res => {
        if (JSON.stringify(res) !== '{}') {
          store.commit('RISKDATAMANAGE_SET_PERMISE_LIST', res);
        }
        callback && callback();
      });
    }
  } else {
    callback && callback();
  }
}

/**
 * 获取子系统菜单
 * @param sysName 子系统名称
 * @param store 子系统store
 * @returns {*}
 */
export function getChildData(sysName, store) {
  const hasOpenedList = store.state.app.hasOpenedList;
  // 如果已经加载过子系统，则promise返回undefined
  if (hasOpenedList.indexOf(sysName) > -1) {
    return Promise.resolve();
  }
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async resolve => {
    // eslint-disable-next-line no-undef
    const res = await _import(sysName);
    if (res) {
      if ((res.length && res.length > 0) || res.default) {
        const newRes =
          res && res[0] && res[0].default ? res[0].default : res.default;
        // 注册子系统store
        if (newRes.store && newRes.store.modules) {
          for (const j in newRes.store.modules) {
            // 判断模块是否已经存在，已存在则不注册
            if (!store._modules.root._children[j]) {
              store.registerModule(j, newRes.store.modules[j]);
            } else {
              console.warn(
                `${sysName}子系统store模块${j}已经存在，不再重复注册`
              );
            }
          }
        }
        // 注册子系统的公共组件
        if (newRes.components && Object.keys(newRes.components).length > 0) {
          registerGlobalComponents(Vue, newRes.components);
        }
        // 注册子系统指令
        if (newRes.directives) {
          // eslint-disable-next-line guard-for-in
          for (const key in newRes.directives) {
            Vue.directive(key, newRes.directives[key]);
          }
        }
        // 注册子系统公共实例化
        if (newRes.utils) {
          // eslint-disable-next-line guard-for-in
          for (const key in newRes.utils) {
            Vue.prototype[key] = newRes.utils[key];
          }
        }
        // 注册插件
        if (newRes.uses) {
          // eslint-disable-next-line guard-for-in
          for (const key in newRes.uses) {
            Vue.use(newRes.uses[key]);
          }
        }
        // 加载国际化
        if (newRes.i18n) {
          const i18n = newRes.i18n;
          if (typeof i18n === 'object' && i18n !== null) {
            // eslint-disable-next-line guard-for-in
            for (const key in i18n) {
              window.i18n.mergeLocaleMessage(key, i18n[key]);
            }
          }
        }
        // 静态菜单路由
        const staticRoutes = newRes.staticRoutes;
        if (Array.isArray(staticRoutes) && staticRoutes.length > 0) {
          store.commit(
            'SET_STATIC_ROUTE_MAP',
            staticRoutes.map(route => {
              route.subSysName = sysName;
              return route;
            })
          );
        }
        resolve({ ...newRes, ident: sysName });
        return;
      }
    }
    resolve();
  });
}

/**
 * 从工作流系统获取流程图组件
 * @param ctx 上下文this
 * @param appName 子系统名称workflow
 * @param routeId graphInfoHui工作流配置的路由id graphInfoHui
 * @returns {*}
 */
export function getDyncPage(ctx, appName, routeId) {
  if (routeId) {
    const pageTplMap = ctx.$store.state.app.pageTplMap;
    if (pageTplMap[routeId]) {
      return new Promise(resolve => {
        resolve(pageTplMap[routeId]);
      });
    } else {
      const clientCode = appName;
      return getChildData(clientCode, ctx.$store).then(res => {
        if (res) {
          // 保存页面模板映射表
          ctx.$store.commit('SET_PAGE_TPL_MAP', res.router);
          // 将子系统加入到已加载列表中
          ctx.$store.commit('ADD_HAS_OPENED_LIST', clientCode);
          return new Promise(resolve => {
            resolve(res.router[routeId]);
          });
        }
        return new Promise(resolve => {
          resolve(null);
        });
      });
    }
  }
}

// 保存下拉选择框选择的历史纪录到本地localstorage
export function saveHistory(data, key, maxLength) {
  let history = localStorage.getItem(key);
  if (history) {
    history = JSON.parse(history);
    if (history) {
      let hasIndex = -1;
      history.forEach((item, index) => {
        if (item.value === data.value) {
          hasIndex = index;
        }
      });
      if (hasIndex !== -1) {
        history.splice(hasIndex, 1);
      }
      history.unshift(data);
      if (history.length > maxLength) {
        history.pop();
      }
    } else {
      history = [];
      history.push(data);
    }
  } else {
    history = [];
    history.push(data);
  }
  localStorage.setItem(key, JSON.stringify(history));
}

// 转为Json解析报错
export function blobToText(blob) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsText(blob);
    fileReader.onload = function () {
      try {
        const result = JSON.parse(this.result);
        if (
          result &&
          (result.hasOwnProperty('return_code') ||
            result.hasOwnProperty('returnCode'))
        ) {
          resolve(result);
        } else {
          reject(new Error(''));
        }
      } catch (e) {
        // TODO handle the exception
        reject(new Error(''));
      }
    };
  });
}

export function doubleNum(n) {
  return n > 0 && n < 10 ? '0' + n : String(n);
}

// 时间转String类型 --> '20200107'
export function dateToStr(_date) {
  let date = _date;
  date = new Date(date);
  return (
    doubleNum(date.getFullYear()) +
    doubleNum(date.getMonth() + 1) +
    doubleNum(date.getDate())
  );
}

// 生成表单数据 - indexcenter
export function generatorSubscibeParams(data, targetObj) {
  // targetObj.combine.type = '2'
  if (data.dispPort !== '0') {
    if (data.dispPort === '1') {
      // 单选
      targetObj.combine.type = '1';
    } else {
      // 多选
      targetObj.combine.type = '2';
    }
  }
  // 报告配置组合列表回显过滤组合树，只显示配置的组合
  targetObj.accIds = data.accIds || [];

  if (data.dispBasi !== '0') {
    targetObj.base.type = '1';
  }

  // 剔除已到期组合
  targetObj.filterExpirePort = data.filterExpirePort || '';
  // 报告类型
  targetObj.templateType = data.tmplType;
  // 模板code
  targetObj.templateCode = data.tmplCode;
  // 报告支持导出类型
  targetObj.exportType = [];
  if (data.tmplType === '1') {
    // hreport只支持导出excel
    targetObj.exportType = [
      {
        label: 'Excel',
        value: 100
      }
    ];
  } else {
    // finreport支持导出excel、word、PDF
    targetObj.exportType = [
      {
        label: 'Excel',
        value: 100
      },
      {
        label: 'Word',
        value: 200
      },
      {
        label: 'PDF',
        value: 300
      }
    ];
  }
  // 选择的导出类型
  targetObj.expMode = data.expMode ? parseInt(data.expMode, 10) : '';
  // 导出方式
  targetObj.reptMethod = data.reptMethod;
  //  日期组件类型data.dateFreq：1-单个日期;其他都是日期区间
  targetObj.dateType = data.dateFreq;

  data.indexParamList.forEach(res => {
    res.dispFlag === '1' &&
      targetObj.formOtherList.push({
        label: res.paraDispName,
        engName: res.custParaEngName,
        type: res.paraWidgType,
        chkFlag: res.chkFlag,
        initvalue: res.codmCont,
        value: res.custParaDefVal,
        data: res,
        required: !!res.permEmptFlag,
        checkNode: {},
        paraUnitCode: res.paraUnitCode,
        prcs: res.prcs,
        formType: '指标',
        show: res.dispFlag === '1',
        max: res.paraMaxVal || Infinity,
        min: res.paraMinVal || -Infinity
      });
  });
  data.reportParamList.forEach(res => {
    res.dispFlag === '1' &&
      targetObj.formOtherList.push({
        label: res.custParaName,
        engName: res.custParaEngName,
        type: res.paraWidgType,
        chkFlag: res.chkFlag,
        initvalue:
          res.paraWidgType === 'SimpleSelect'
            ? getArrayByString(res.codmCont)
            : res.codmCont,
        value: res.custParaDefVal,
        data: res,
        paraUnitCode: res.paraUnitCode,
        prcs: res.prcs,
        formType: '报告',
        show: res.dispFlag === '1',
        max: res.paraMaxVal || Infinity,
        min: res.paraMinVal || -Infinity
      });
  });
  data.subreportParamList.forEach(res => {
    res.dispFlag === '1' &&
      targetObj.formOtherList.push({
        label: res.paraDispName,
        engName: res.custParaEngName,
        type: res.paraWidgType,
        chkFlag: res.chkFlag,
        initvalue: res.codmCont,
        value: res.custParaDefVal,
        data: res,
        paraUnitCode: res.paraUnitCode,
        prcs: res.prcs,
        formType: '子报告',
        show: res.dispFlag === '1',
        max: res.paraMaxVal || Infinity,
        min: res.paraMinVal || -Infinity
      });
  });
}

/**
 * @function getPortCode
 * @param ctx Object this指向
 * @description 从地址路由获取产品组合id
 */
export function getPortCode(ctx) {
  return ctx.$route.path.split('/').pop();
}

/**
 * 数组去重
 * @param arr
 * @returns {any[]}
 */
export function uniq(arr) {
  const x = new Set(arr);
  return [...x];
}

export function getGridParams(boxWidth, itemTotal) {
  let gridSpan = 8;
  let actionOffset = 0;

  function getGriddata(span) {
    if (itemTotal % (24 / span) !== 0) {
      actionOffset = 24 - (itemTotal % (24 / span)) * span;
    } else {
      actionOffset = 0;
    }
  }

  if (boxWidth >= 1560) {
    gridSpan = 4;
    getGriddata(gridSpan);
  } else if (boxWidth >= 992 && boxWidth < 1560) {
    gridSpan = 6;
    getGriddata(gridSpan);
  } else if (boxWidth >= 664 && boxWidth < 992) {
    gridSpan = 8;
    getGriddata(gridSpan);
  } else if (boxWidth < 664) {
    gridSpan = 12;
    getGriddata(gridSpan);
  }
  return { gridSpan, actionOffset };
}

// 判断参数是否是其中之一
export function oneOf(value, validList) {
  for (let i = 0; i < validList.length; i++) {
    if (value === validList[i]) {
      return true;
    }
  }
  return false;
}

/**
 * @function getFunName
 * @param func {Function} 需要获取名字的函数
 * @description 获取函数名称
 */
export function getFunName(func) {
  if (typeof func === 'function') {
    const name = func.name;
    if (name.indexOf('bound') !== -1) {
      // vue内部this指向代理的函数name会带有‘bound ’标时，需要截取后面的函数名
      return name.split(' ')[1];
    } else {
      // 普通函数可以直接获取函数名
      return name;
    }
  }
  return '';
}

// 保存下拉选择框选择的历史纪录到本地localstorage
export function updateHistory(data, key) {
  let history = localStorage.getItem(key);
  if (history) {
    history = JSON.parse(history);
    for (let i = 0; i < history.length; i++) {
      if (history[i].value === data.value) {
        history[i].label = data.label;
        break;
      }
    }
  }
  localStorage.setItem(key, JSON.stringify(history));
}

// 遍历树处理children为null为[]，为null时hui不能异步加载
export function setTreeChildren(node) {
  if (!node) {
    return;
  }
  const stack = [];
  stack.push(node);
  let tmpNode;
  while (stack.length > 0) {
    tmpNode = stack.pop();
    if (!tmpNode.leaf) {
      tmpNode.children = tmpNode.children ? tmpNode.children : [];
    }

    if (tmpNode.children && tmpNode.children.length > 0) {
      let i = tmpNode.children.length - 1;
      for (i = tmpNode.children.length - 1; i >= 0; i--) {
        stack.push(tmpNode.children[i]);
      }
    }
  }
}

/** ************ 保监会 ****************/
// 根据枚举id获取name， 枚举的格式必须是[{value: "", label: ""}, ...]
export function getLabelById(v, list) {
  if (!list) {
    return '';
  }
  const filterList = list.filter(item => item.value === v);
  if (filterList.length === 0) {
    return '';
  }
  return filterList[0].label;
}

/**
 * 设置最后一列的宽度为自适应， 统一规范
 * @template T
 * @param {T[]} columns
 * @returns {T[]}
 */
export function setLastColumnAuto(columns = []) {
  if (columns.length == 0) return [];
  const lastItem = columns.pop() || {};
  if (lastItem.width) {
    lastItem.minWidth = lastItem.width;
    delete lastItem.width;
  }
  return [].concat(columns, {
    ...lastItem
  });
}

/**
 * This method is like `clone` except that it recursively clones `value`.
 * Object inheritance is preserved.
 *
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see clone
 * @example
 *
 * const objects = [{ 'a': 1 }, { 'b': 2 }]
 *
 * const deep = cloneDeep(objects)
 * console.log(deep[0] === objects[0])
 * // => false
 */
export function cloneDeep(value) {
  return baseClone(value, 1);
}

/**
 *
 * @param {boolean} [disableToday] 是否禁用今天
 * @returns {{value(): Date[], text: string}[]}
 */
export function getCommonDatePickShortCuts(disableToday) {
  function getNewDate(disableToday) {
    const date = new Date();
    if (disableToday) {
      return new Date(Number(date) - 3600 * 1000 * 24);
    } else {
      return date;
    }
  }
  const shortCuts = [
    {
      text: '最近一周',
      value() {
        const end = getNewDate(disableToday);
        const start = getNewDate();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
        return [start, end];
      }
    },
    {
      text: '最近一个月',
      value() {
        const end = getNewDate(disableToday);
        const start = getNewDate();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
        return [start, end];
      }
    },
    {
      text: '最近三个月',
      value() {
        const end = getNewDate(disableToday);
        const start = getNewDate();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
        return [start, end];
      }
    },
    {
      text: '本周',
      value() {
        const end = getNewDate(disableToday);
        const endValue = end.getTime();
        for (let i = 0; i < 7; i++) {
          const d = new Date(endValue - 3600 * 1000 * 24 * i);
          if (d.getDay() === 1) return [d, end];
        }
        return [end, end];
      }
    },
    {
      text: '本月',
      value() {
        const end = getNewDate(disableToday);
        const start = getNewDate();
        start.setDate(1);
        return [start, end];
      }
    },
    {
      text: '本季',
      value() {
        const end = getNewDate(disableToday);
        const start = getNewDate();
        const endMonth = end.getMonth();
        start.setDate(1);
        if (endMonth < 3) {
          start.setMonth(0);
        } else if (endMonth < 6) {
          start.setMonth(3);
        } else if (endMonth < 9) {
          start.setMonth(6);
        } else {
          start.setMonth(9);
        }
        return [start, end];
      }
    },
    {
      text: '今年以来',
      value() {
        const end = getNewDate(disableToday);
        const start = getNewDate();
        start.setDate(1);
        start.setMonth(0);
        return [start, end];
      }
    }
  ];

  if (disableToday) {
    const today = getNewDate();
    /** 是1月1日不显示今年以来 */
    if (today.getMonth() === 0 && today.getDate() === 1)
      shortCuts.splice(
        shortCuts.findIndex(v => v.text === '今年以来'),
        1
      );
    /** 季度的第一天不显示本季 */
    if (today.getDate() === 1 && today.getMonth() % 3 === 0)
      shortCuts.splice(
        shortCuts.findIndex(v => v.text === '本季'),
        1
      );
    /** 一日不显示本月 */
    if (today.getDate() === 1)
      shortCuts.splice(
        shortCuts.findIndex(v => v.text === '本月'),
        1
      );
    /** 周一时不显示本周 */
    if (today.getDay() === 1)
      shortCuts.splice(
        shortCuts.findIndex(v => v.text === '本周'),
        1
      );
  }
  return shortCuts;
}

export const basic10Colors = [
  '#3987DF',
  '#F2BB1C',
  '#3A6081',
  '#59BE7F',
  '#7E5DB4',
  '#64C4E6',
  '#5657DC',
  '#E87D2A',
  '#0A7460',
  '#E682A0'
];

export const basic20Colors = [
  '#3987DF',
  '#9CC3EF',
  '#F2BB1C',
  '#FADD8A',
  '#3A6081',
  '#9CAFC0',
  '#59BE7F',
  '#B4E2C5',
  '#7E5DB4',
  '#BEAED9',
  '#64C4E6',
  '#B1E1F2',
  '#5657DC',
  '#AAABED',
  '#E87D2A',
  '#F9C6AB',
  '#0A7460',
  '#9AD0C4',
  '#E682A0',
  '#F2C0CF'
];

export const standardColor = {
  red: '#E3373B',
  green: '#45A955',
  /** 红色 由浅至深 */
  reds: ['#FFBEB8', '#FC938D', '#F06260', '#E3373B', '#BD242B', '#961520'],
  /** 绿色 由浅至深 */
  greens: ['#B8CFB9', '#8DC293', '#67B572', '#45A955', '#2F823F', '#1C5C2B']
};

/**
 * 将业务中用到的calcMode对象处理成一个字符串
 * @param {{ mergeCalc: boolean; nodeCalc: boolean; summary: boolean; }} originMode 原始的originMode
 * @param {boolean} legacy 兼容模式 只返回'combineCalc' | 'nodeCalc'
 * @returns {'' | 'combineCalc' | 'nodeCalc' | 'allModeCalc'}
 */
export const getCalcMode = (originMode, legacy = false) => {
  if (!originMode) {
    return '';
  }
  if (legacy) {
    if (originMode.mergeCalc) {
      return 'combineCalc';
    } else if (originMode.nodeCalc) {
      return 'nodeCalc';
    } else {
      return '';
    }
  }
  if (originMode.mergeCalc) {
    return 'combineCalc';
  } else if (originMode.nodeCalc) {
    if (originMode.summary) {
      return 'allModeCalc';
    } else {
      return 'nodeCalc';
    }
  } else {
    if (originMode.summary) {
      return 'allModeCalc';
    } else {
      return '';
    }
  }
};

/**
 * 防抖
 * @template T
 * @param {T} fun 被防抖的方法
 * @param {number} delay 延时时间
 * @returns {( ...parameter: Parameters<T> ) => void}
 */
export function debounce(fun, delay) {
  let timer = null;
  return function (...param) {
    timer && clearTimeout(timer);
    // @ts-ignore
    timer = setTimeout(() => fun(...param), delay);
  };
}

/**
 * 获取两个日期相隔的天数 (2000-1-1到2000-1-2会返回1而不是2)
 * @param {string|number} data1 日期中小的那个
 * @param {string|number} date2 日期中大的那个
 * @returns {number}
 */
export const getRangeOfTwoDates = function (data1, date2) {
  // return
  const d1 = new Date(
    String(data1).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  );
  const d2 = new Date(
    String(date2).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  );
  return Math.round((Number(d2) - Number(d1)) / (24 * 3600 * 1000));
};

/**
 * 生成双y轴图表参数
 * @typedef {Object} DoubleYAxisGeneratorParam
 * @property {(string|number)[][]} datas 数据, 长度是2
 * @property {'line' | 'bar'} type 图表类型
 * @property {number} splitNumber 坐标轴轴需要几等分 会出现 splitNumber+1 条线
 * @property {number} [padding] 两边需要空多少, 0~0.5
 * @param {DoubleYAxisGeneratorParam} param0
 * @returns {{ max: number[], min: number[], interval: number[], axisLabelFormatters: ((v: number) => number)[] }}
 */
export const doubleYAxisGenerator = function ({
  datas,
  type,
  splitNumber = 6,
  padding = 0
}) {
  const originDatas = datas.map(list => list.map(v => Number(v)));
  /** 如果只传了一边的数据  复制一份 */
  if (originDatas.length === 1) {
    originDatas.push(originDatas[0]);
  }

  let min0 = type === 'bar' ? 0 : Infinity;
  let min1 = type === 'bar' ? 0 : Infinity;
  let max0 = type === 'bar' ? 0 : -Infinity;
  let max1 = type === 'bar' ? 0 : -Infinity;

  originDatas[0].forEach(v => {
    if (min0 > v) {
      min0 = v;
    }
    if (max0 < v) {
      max0 = v;
    }
  });

  originDatas[1].forEach(v => {
    if (min1 > v) {
      min1 = v;
    }
    if (max1 < v) {
      max1 = v;
    }
  });

  if (min0 === Infinity) {
    min0 = 0;
  }
  if (min1 === Infinity) {
    min1 = 0;
  }
  if (max0 === -Infinity) {
    max0 = 0;
  }
  if (max1 === -Infinity) {
    max1 = 0;
  }

  let same0 = false;
  let same1 = false;

  if (max0 - min0 < Number.MIN_VALUE) {
    same0 = true;
    max0 += 0.1 * splitNumber;
    min0 -= 0.1 * splitNumber;
  }
  if (max1 - min1 < Number.MIN_VALUE) {
    same1 = true;
    max1 += 0.1 * splitNumber;
    min1 -= 0.1 * splitNumber;
  }

  if (padding > 0) {
    const w0 = max0 - min0;
    const w1 = max1 - min1;
    if (!same0) {
      min0 -= padding * w0;
      max0 += padding * w0;
    }
    if (!same1) {
      min1 -= padding * w1;
      max1 += padding * w1;
    }
  }

  if (type === 'bar') {
    const zeroPos0 = max0 / (max0 - min0);
    const zeroPos1 = max1 / (max1 - min1);

    if (zeroPos0 < zeroPos1) {
      if (zeroPos1 === 1) {
        min1 = ((zeroPos0 - 1) * max1) / zeroPos0;
      } else {
        max0 = -(zeroPos1 * min0) / (1 - zeroPos1);
      }
    } else if (zeroPos0 > zeroPos1) {
      if (zeroPos0 === 1) {
        min0 = ((zeroPos1 - 0) * max0) / zeroPos1;
      } else {
        max1 = -(zeroPos0 * min1) / (1 - zeroPos0);
      }
    }
  }

  const ticks0Origin = new Array(splitNumber + 1).fill().map((v, i) => {
    return ((max0 - min0) / splitNumber) * i + min0;
  });
  const ticks1Origin = new Array(splitNumber + 1).fill().map((v, i) => {
    return ((max1 - min1) / splitNumber) * i + min1;
  });

  let width0 = max0 - min0;
  let scale0 = 100;
  while (width0 < 1 && width0 > 0) {
    scale0 *= 10;
    width0 *= 10;
  }
  let width1 = max1 - min1;
  let scale1 = 100;
  while (width1 < 1 && width1 > 0) {
    scale1 *= 10;
    width1 *= 10;
  }

  const ticks0 = ticks0Origin.map(v => {
    return Math.floor(v * scale0) / scale0;
  });
  const ticks1 = ticks1Origin.map(v => {
    return Math.floor(v * scale1) / scale1;
  });

  return {
    max: [max0, max1],
    min: [min0, min1],
    interval: [(max0 - min0) / splitNumber, (max1 - min1) / splitNumber],
    axisLabelFormatters: [
      function (v) {
        let hit = '';
        ticks0Origin.forEach((tick, i) => {
          if (Math.abs(v - tick) < (max0 - min0) / splitNumber / 100) {
            hit = String(i);
          }
          return undefined;
        });
        return hit ? ticks0[hit] : axisLabelFormatter(v);
      },
      function (v) {
        let hit = '';
        ticks1Origin.forEach((tick, i) => {
          if (Math.abs(v - tick) < (max1 - min1) / splitNumber / 100) {
            hit = String(i);
          }
          return undefined;
        });
        return hit ? ticks1[hit] : axisLabelFormatter(v);
      }
    ]
  };
};

/** echart图表轴刻度的formatter 防止小数位太长 */
export const axisLabelFormatter = function (v) {
  if (String(v).split('.')[1]?.length > 5)
    return String(v).match(/(.*\.0*[1-9]{1,2})/)?.[0] ?? v;
  return v;
};

/**
 * 删除路由中的某个参数
 * 但是讲真的 不如在参数后面拼一个随机数 保证每次参数不一样
 * 那样执行起来比较简单吧
 * @param {Vue} vm VueComponent实例
 * @param {string} key 要删除的属性的字段
 */
export const deleteRouteQuery = function (vm, key) {
  if (isUcf()) {
    window.location.hash = location.hash.replace(
      new RegExp('\\&?' + key + '=.*?($|\\&)'),
      '$1'
    );
  } else {
    const tab = vm.$store.state.root?.skeleton?.tabList.find(
      v => v.uuid === vm.$route.meta.id
    );
    if (tab) {
      delete tab.query[key];
    }
  }
};

/**
 * 当终端下 指定页面被激活时 触发回调
 * @param {string} tabId 监听的tab页面的id
 * @param {{():void}} tabId 激活时的回调
 */
export const onUcfTabActivated = function (tabId, cb) {
  if (isUcf()) {
    window.ucf.api.platform.subscribe('webview/tabs/change', () => {
      try {
        const tab = JSON.parse(window.ucf.api.storage._data.ACTIVE_TAB);
        if (tab.id === tabId) {
          setTimeout(() => {
            cb?.();
          }, 100);
        }
      } catch (e) {
        console.warn(e);
      }
    });
  }
  /** TODO:可能需要返回一个解绑的函数 */
  return;
};
