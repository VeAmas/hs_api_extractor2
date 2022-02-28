import { httpUnderline as fetch, httpCamel } from '@fais/tzjc-comps';

const CUSTOMIZED_SERVER = window.HSFUNDRISK_CONFIG.API_HOME_CUSTOMIZED_SERVER; // 自定义视图接口
const CUSTOMIZED_HTTP = window.HSFUNDRISK_CONFIG.API_HOME_CUSTOMIZED_HTTP; // 自定义视图接口
const RISKPUBDATA_SERVER = window.HSFUNDRISK_CONFIG.API_HOME_RISKPUBDATA_SERVER; //
const INDEXCENTER_SERVER = window.HSFUNDRISK_CONFIG.API_HOME_INDEXCENTER_SERVER;
const USERCFG_HOME = window.HSFUNDRISK_CONFIG.USERCFG_HOME;

// 计算接口取消
export function cancelCalcView(params) {
  return fetch.post(INDEXCENTER_SERVER + '/cancelRequests', params);
}
// 获取自定义视图展现方式
export function getViewPictureType(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getViewPictureType', data);
}
// 获取自定义视图所有缩略图信息
export function getCustomViewListObjects(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getCustomViewListObjects', data);
}
// 获取缩略图图片信息
export function getThumbNailView(data) {
  return fetch.get(CUSTOMIZED_HTTP + '/getThumbNailView?viewId=' + data);
}
// 更换缩略图顺序
export function saveCustomViewPosition(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/saveCustomViewPosition', data);
}
// 获取基准树
// 获取自定义基准树
export function getBenchmarkTree(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/queryBasiClassInfo', data);
}
// 获取基准树
// 获取常用指数
export function queryMktBasiConstInfo(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/queryMktBasiConstInfo', data);
}
// 获取工具箱分类
export function getAssemblyClass(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getAssemblyClass', data);
}
// 获取所有组件
export function getAssemblyInfoById(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getAssemblyInfoById', data);
}
// 获取一个tab的所有已选指标
export function getAssemblySelectedIndex(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getAssemblySelectedIndex', data);
}
// 获取一个tab的所有可选指标
export function getAssemblyOptionalIndex(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getAssemblyOptionalIndex', data);
}
// 保存视图
export function saveViewInfo(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/saveViewInfo', data);
}
// 获取视图信息
export function getViewInfoByViewId(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getViewInfoByViewId', data);
}
// 删除视图信息
export function deleteViewInfo(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/deleteViewInfo', data);
}
// 计算视图  viewCalc
export function viewCalc(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/viewCalc', data);
}
// 计算视图  viewCalcMq
export function viewCalcMq(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/viewCalcMq', data);
}

// 指标穿透计算视图
export function viewCalcIndexPenetra(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/indexPenetrationCalc', data);
}

// 指标穿透计算视图socket
export function indexPenetrationCalcMq(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/indexPenetrationCalcMq', data);
}

// 指标穿透 点击指定的值获取穿透
export function getIndexPenetraValue(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getPenetrationByIndex', data);
}

// 指标穿透 获取穿透指标的时间队列
export function getIndexPenetraTimeList(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getTimeSeriesList', data);
}

// 查询组合数 queryCombiRightTree
export function getCombiRightTree(data) {
  return fetch.get(RISKPUBDATA_SERVER + '/getCombiRightTree?id=' + data.id);
}
export function getSearchCombiRightTreeRelate(data) {
  return fetch.get(
    RISKPUBDATA_SERVER +
      '/getSearchCombiRightTreeRelate?id=' +
      data.id +
      '&query_text=' +
      data.query_text
  );
}
// 根据文字查询组件 fuzzySearchComponent
export function fuzzySearchComponent(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/fuzzySearchComponent', data);
}
// 判断名称是否重复 duplicateName
export function duplicateName(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/duplicateName', data);
}
// 基准 getIfSyByQueryText
export function getIfSyByQueryText(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/getInfoSecurityListLimit', data);
}
// 模糊搜索组合树 searchCombiRightTreeRelate
export function searchCombiRightTreeRelate(data) {
  return fetch.get(
    RISKPUBDATA_SERVER +
      '/searchCombiRightTreeRelate?data_src_code=' +
      data.data_src_code +
      '&acc_hirc=' +
      data.acc_hirc +
      '&query_text=' +
      data.query_text
  );
}
// queryDimsClasInfo
export function queryDimsClasInfo(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/queryDimsTreeControl', data);
}
// 导出 export
export function exportView(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/export', data);
}
// 修改视图名称 saveViewName
export function saveViewName(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/saveViewName', data);
}

// 保存更新规则配置 saveIndxInfoList
export function saveIndxInfoList(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/saveIndxInfoList', data);
}
// 获取规则配置信息 getListByAppNum
export function getListByAppNum(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/getListByAppNum', data);
}
// 获取用户未配置权限的视图 getUndistributedUserViewLists
export function getUndistributedUserViewLists(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getUndistributedUserViewLists', data);
}
// 获取用户已配置权限的视图 getDistributedUserViewLists
export function getDistributedUserViewLists(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getDistributedUserViewLists', data);
}
// 保存用户已配置权限的视图 distributeUserView
export function distributeUserView(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/distributeUserView', data);
}
// 获取用户列表 getUserList
export function getUserList(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/getUserList', data);
}
// 查询部门人员树
export function queryOrgTreeList(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/queryOrgTreeList', data);
}

/** @type {import('../../types/public').SavePublicParameters} 保存用户视图参数接口 savePublicParameters */
export function savePublicParameters(data) {
  return fetch.post(USERCFG_HOME + '/savePublicParameters', data);
}

/** @type {import('../../types/public').GetUserPublicParameters} 获取保存的视图参数 getUserPublicParameters */
export function getUserPublicParameters(data) {
  return fetch.post(USERCFG_HOME + '/getUserPublicParameters', data);
}

// 获取因子数列表 getFactorDisplayTreeNode
export function getFactorDisplayTreeNode(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getFactorDisplayTreeNode', data);
}

// 保存特殊组件参数 saveUserFactorParam
export function saveUserFactorParam(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/saveUserFactorParam', data);
}

// 获取特殊组件参数值 getUserFactorParam
export function getUserFactorParam(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getUserFactorParam', data);
}

// 获取画布类型接口
export function getViewPanel(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getViewPanel', data);
}

// 获取视图查询接口
export function getCustomViews(data) {
  return fetch.post(CUSTOMIZED_SERVER + '/getCustomViews', data);
}

// 情景方案树查询接口
export function querySceneDetailTree(data) {
  return fetch.post(RISKPUBDATA_SERVER + '/querySceneDetailTree', data);
}

/** @type {import('../../types/public').ShowViewParamters} 自定义组件-视图参数展示 showViewParamters */
export function showViewParamters(data) {
  return httpCamel.post(CUSTOMIZED_SERVER + '/showViewParamters', data);
}
